import {query} from "./_generated/server";
import {isAdminUserId} from "./lib/roles";

export const envStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("UNAUTHORIZED");
        return {
            openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
            userId: identity.subject,
            isAdmin: isAdminUserId(identity.subject),
        };
    },
});
