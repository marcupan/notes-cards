import {v} from "convex/values";
import {query, mutation} from "./_generated/server";
import {isAdminUserId} from "./lib/roles";

// Query: listFolders (owner only)
export const listFolders = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");

        const folders = await ctx.db
            .query("folders")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .collect();

        return folders;
    },
});

// Mutation: createFolder (owner only)
export const createFolder = mutation({
    args: {name: v.string()},
    handler: async (ctx, {name}) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");

        const trimmed = name.trim();
        if (!trimmed || trimmed.length < 1 || trimmed.length > 50) {
            throw new Error("INVALID_FOLDER_NAME");
        }

        // Enforce uniqueness per user (case-insensitive)
        const existing = await ctx.db
            .query("folders")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .collect();
        if (existing.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
            throw new Error("FOLDER_NAME_EXISTS");
        }

        const now = Date.now();
        const id = await ctx.db.insert("folders", {
            name: trimmed,
            userId: identity.subject,
            createdAt: now,
        });
        return id;
    },
});

// Mutation: deleteFolder (block if non-empty)
export const deleteFolder = mutation({
    args: {folderId: v.id("folders")},
    handler: async (ctx, {folderId}) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");

        const folder = await ctx.db.get(folderId);
        if (!folder) throw new Error("NOT_FOUND");
        const isAdmin = isAdminUserId(identity.subject);
        if (!isAdmin && folder.userId !== identity.subject) throw new Error("FORBIDDEN");

        // Check if any cards exist in this folder
        const card = await ctx.db
            .query("cards")
            .withIndex("by_folder", (q) => q.eq("folderId", folderId))
            .first();
        if (card) throw new Error("FOLDER_NOT_EMPTY");

        await ctx.db.delete(folderId);
        return "ok";
    },
});
