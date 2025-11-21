import { v } from "convex/values";
import { action, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { z } from "zod";

// Type for card with createdAt from rate limit query
interface CardWithTimestamp {
  createdAt: number;
}

const CardContent = z.object({
  translation: z.string().min(1),
  characterBreakdown: z.array(z.string()).min(1),
  exampleSentences: z.array(z.string()).min(3).max(3),
});

export const generateCard = action({
  args: { originalWord: v.string(), folderId: v.id("folders") },
  handler: async (ctx, { originalWord, folderId }): Promise<Id<"cards">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHORIZED");

    const userId = identity.subject;
    const word = originalWord.trim();
    if (!word) throw new Error("INVALID_ORIGINAL_WORD");
    if (word.length > 20) throw new Error("INVALID_ORIGINAL_WORD");
    const hasHan = /\p{Script=Han}/u.test(word);
    if (!hasHan) throw new Error("INVALID_ORIGINAL_WORD");

    // Duplicate guard per user+word (any folder)
    const dup = await ctx.runQuery(internal.generateCard.hasUserWordInternal, { userId, originalWord: word });
    if (dup) throw new Error("DUPLICATE_CARD");

    // Rate limiting via recent card counts (5/min, 20/day)
    const now = Date.now();
    const minuteAgo = now - 60_000;
    const dayAgo = now - 86_400_000;
    const recent = await ctx.runQuery(internal.generateCard.getUserRecentCardCountsInternal, { userId, sinceMs: Math.min(minuteAgo, dayAgo) });
    const perMinute = recent.filter((c: CardWithTimestamp) => c.createdAt >= minuteAgo).length;
    const perDay = recent.filter((c: CardWithTimestamp) => c.createdAt >= dayAgo).length;
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
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`OpenAI API error ${res.status}:`, errorText);
        throw new Error(`OPENAI_ERROR_${res.status}`);
      }
      const json = (await res.json()) as any;
      const content = json?.choices?.[0]?.message?.content;
      if (!content) {
        console.error("No content in OpenAI response:", json);
        throw new Error("OPENAI_NO_CONTENT");
      }
      data = JSON.parse(content);
    } catch (err) {
      clearTimeout(timeout);
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("AI call failed:", errorMsg);
      throw new Error(`AI_CALL_FAILED: ${errorMsg}`);
    }

    const parsed = CardContent.safeParse(data);
    if (!parsed.success) throw new Error("INVALID_AI_RESPONSE");

    // Save via mutation
    const id = await ctx.runMutation(internal.generateCard.saveCardInternal, {
      folderId,
      userId,
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

// Internal functions for action calls
export const hasUserWordInternal = internalQuery({
  args: { userId: v.string(), originalWord: v.string() },
  handler: async (ctx, { userId, originalWord }) => {
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_user_and_word", (q) => q.eq("userId", userId).eq("originalWord", originalWord))
      .first();
    return existing !== null;
  },
});

export const getUserRecentCardCountsInternal = internalQuery({
  args: { userId: v.string(), sinceMs: v.number() },
  handler: async (ctx, { userId, sinceMs }) => {
    const rows = await ctx.db
      .query("cards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.filter((r) => r.createdAt >= sinceMs);
  },
});

export const saveCardInternal = internalMutation({
  args: {
    folderId: v.id("folders"),
    userId: v.string(),
    originalWord: v.string(),
    translation: v.string(),
    characterBreakdown: v.array(v.string()),
    exampleSentences: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("cards", {
      folderId: args.folderId,
      userId: args.userId,
      originalWord: args.originalWord,
      translation: args.translation,
      characterBreakdown: args.characterBreakdown,
      exampleSentences: args.exampleSentences,
      createdAt: now,
    });
    return id;
  },
});
