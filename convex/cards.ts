import {v} from "convex/values";
import {query, mutation} from "./_generated/server";
import {isAdminUserId} from "./lib/roles";

// Query: listCardsByFolder (owner only)
export const listCardsByFolder = query({
    args: {folderId: v.id("folders")},
    handler: async (ctx, {folderId}) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");

        const folder = await ctx.db.get(folderId);
        if (!folder) throw new Error("NOT_FOUND");
        if (folder.userId !== identity.subject) throw new Error("FORBIDDEN");

        const cards = await ctx.db
            .query("cards")
            .withIndex("by_folder", (q) => q.eq("folderId", folderId))
            .collect();

        return cards;
    },
});

// Mutation: saveCard (owner only)
export const saveCard = mutation({
    args: {
        folderId: v.id("folders"),
        originalWord: v.string(),
        translation: v.string(),
        characterBreakdown: v.array(v.string()),
        exampleSentences: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");

        const folder = await ctx.db.get(args.folderId);
        if (!folder) throw new Error("NOT_FOUND");
        if (folder.userId !== identity.subject) throw new Error("FORBIDDEN");

        // Basic validation guards (in addition to v.* types)
        if (!args.originalWord.trim()) throw new Error("INVALID_ORIGINAL_WORD");
        if (!args.translation.trim()) throw new Error("INVALID_TRANSLATION");
        if (args.exampleSentences.length !== 3)
            throw new Error("INVALID_EXAMPLE_SENTENCES");

        const now = Date.now();
        const id = await ctx.db.insert("cards", {
            folderId: args.folderId,
            userId: identity.subject,
            originalWord: args.originalWord.trim(),
            translation: args.translation.trim(),
            characterBreakdown: args.characterBreakdown,
            exampleSentences: args.exampleSentences,
            createdAt: now,
        });
        return id;
    },
});

// Mutation: updateCard (owner only)
export const updateCard = mutation({
    args: {
        cardId: v.id("cards"),
        translation: v.optional(v.string()),
        characterBreakdown: v.optional(v.array(v.string())),
        exampleSentences: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");
        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("NOT_FOUND");
        const isAdmin = isAdminUserId(identity.subject);
        if (!isAdmin && card.userId !== identity.subject) throw new Error("FORBIDDEN");

        const patch: {
            translation?: string;
            characterBreakdown?: string[];
            exampleSentences?: string[];
        } = {};
        if (args.translation !== undefined) patch.translation = args.translation;
        if (args.characterBreakdown !== undefined)
            patch.characterBreakdown = args.characterBreakdown;
        if (args.exampleSentences !== undefined) {
            if (args.exampleSentences.length !== 3)
                throw new Error("INVALID_EXAMPLE_SENTENCES");
            patch.exampleSentences = args.exampleSentences;
        }
        await ctx.db.patch(args.cardId, patch);
        return "ok";
    },
});

// Mutation: deleteCard (owner only)
export const deleteCard = mutation({
    args: {cardId: v.id("cards")},
    handler: async (ctx, {cardId}) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");
        const card = await ctx.db.get(cardId);
        if (!card) throw new Error("NOT_FOUND");
        const isAdmin = isAdminUserId(identity.subject);
        if (!isAdmin && card.userId !== identity.subject) throw new Error("FORBIDDEN");
        await ctx.db.delete(cardId);
        return "ok";
    },
});

// Mutation: moveCard to another folder (owner only)
export const moveCard = mutation({
    args: {cardId: v.id("cards"), folderId: v.id("folders")},
    handler: async (ctx, {cardId, folderId}) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");
        const card = await ctx.db.get(cardId);
        if (!card) throw new Error("NOT_FOUND");
        const isAdmin = isAdminUserId(identity.subject);
        if (!isAdmin && card.userId !== identity.subject) throw new Error("FORBIDDEN");
        const folder = await ctx.db.get(folderId);
        if (!folder) throw new Error("FOLDER_NOT_FOUND");
        if (!isAdmin && folder.userId !== identity.subject) throw new Error("FORBIDDEN");
        await ctx.db.patch(cardId, {folderId});
        return "ok";
    },
});

// Query: search cards by originalWord (scoped to user), optional folder filter
export const searchCards = query({
    args: {q: v.string(), folderId: v.optional(v.id("folders"))},
    handler: async (ctx, {q, folderId}) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");

        const base = ctx.db
            .query("cards")
            .withSearchIndex("search_originalWord", (qidx) =>
                qidx.search("originalWord", q).eq("userId", identity.subject)
            );

        const results = folderId
            ? await base.filter((qb) => qb.eq(qb.field("folderId"), folderId)).collect()
            : await base.collect();

        return results;
    },
});

// Query: check if user already has a card for a word (any folder)
export const hasUserWord = query({
    args: {userId: v.string(), originalWord: v.string()},
    handler: async (ctx, {userId, originalWord}) => {
        const existing = await ctx.db
            .query("cards")
            .withIndex("by_user_and_word", (q) => q.eq("userId", userId).eq("originalWord", originalWord))
            .first();
        return existing !== null;
    },
});
