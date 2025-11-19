import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { z } from "zod";

const CardContent = z.object({
  translation: z.string().min(1),
  characterBreakdown: z.array(z.string()).min(1),
  exampleSentences: z.array(z.string()).min(3).max(3),
});

export const generateCard = action({
  args: { originalWord: v.string(), folderId: v.id("folders") },
  handler: async (ctx, { originalWord, folderId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHORIZED");

    const userId = identity.subject;
    const word = originalWord.trim();
    if (!word) throw new Error("INVALID_ORIGINAL_WORD");
    if (word.length > 20) throw new Error("INVALID_ORIGINAL_WORD");
    const hasHan = /\p{Script=Han}/u.test(word);
    if (!hasHan) throw new Error("INVALID_ORIGINAL_WORD");

    // Duplicate guard per user+word (any folder)
    const dup = await ctx.runQuery("cards:hasUserWord", { userId, originalWord: word });
    if (dup) throw new Error("DUPLICATE_CARD");

    // Rate limiting via recent card counts (5/min, 20/day)
    const now = Date.now();
    const minuteAgo = now - 60_000;
    const dayAgo = now - 86_400_000;
    const recent = await ctx.runQuery("generateCard:getUserRecentCardCounts", { userId, sinceMs: Math.min(minuteAgo, dayAgo) });
    const perMinute = recent.filter((c) => c.createdAt >= minuteAgo).length;
    const perDay = recent.filter((c) => c.createdAt >= dayAgo).length;
    if (perMinute >= 5 || perDay >= 20) throw new Error("RATE_LIMITED");

    // OpenAI call with 10s timeout
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("SERVER_MISCONFIGURED");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let data: unknown;
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: "You produce concise JSON only. No extra text." },
            {
              role: "user",
              content: `Create a Chinese study card as compact JSON with keys: translation (string), characterBreakdown (array of strings), exampleSentences (array of exactly 3 strings). Use simplified characters and concise English in translation. Original word: ${word}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`OPENAI_ERROR_${res.status}`);
      const json = (await res.json()) as any;
      const content = json?.choices?.[0]?.message?.content;
      data = JSON.parse(content);
    } catch (err) {
      clearTimeout(timeout);
      throw new Error("AI_CALL_FAILED");
    }

    const parsed = CardContent.safeParse(data);
    if (!parsed.success) throw new Error("INVALID_AI_RESPONSE");

    // Save via mutation
    const id = await ctx.runMutation("cards:saveCard", {
      folderId,
      originalWord: word,
      translation: parsed.data.translation,
      characterBreakdown: parsed.data.characterBreakdown,
      exampleSentences: parsed.data.exampleSentences,
    });
    return id;
  },
});

// Internal query helper to fetch recent user cards
export const getUserRecentCardCounts = query({
  args: { userId: v.string(), sinceMs: v.number() },
  handler: async (ctx, { userId, sinceMs }) => {
    const rows = await ctx.db
      .query("cards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.filter((r) => r.createdAt >= sinceMs);
  },
});
