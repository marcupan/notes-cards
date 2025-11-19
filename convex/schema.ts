import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Convex schema: folders and cards
export default defineSchema({
  folders: defineTable({
    name: v.string(),
    userId: v.string(),
    createdAt: v.number(), // Date.now()
  }).index("by_user", ["userId"]),

  cards: defineTable({
    originalWord: v.string(),
    translation: v.string(),
    characterBreakdown: v.array(v.string()),
    exampleSentences: v.array(v.string()), // expect length 3 in validation later
    folderId: v.id("folders"),
    userId: v.string(),
    createdAt: v.number(), // Date.now()
  })
    .index("by_user", ["userId"]) // support user-scoped counting/rate limits
    .index("by_user_and_word", ["userId", "originalWord"]) // duplicate guard
    .index("by_folder", ["folderId"]) // for folder deletion checks and listing
    .searchIndex("search_originalWord", {
      searchField: "originalWord",
      filterFields: ["userId"], // scope searches by user in queries
    }),
});
