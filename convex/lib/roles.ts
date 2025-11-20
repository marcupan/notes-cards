export function isAdminUserId(userId: string | undefined): boolean {
    if (!userId) return false;
    const raw = process.env.ADMIN_USER_IDS || "";
    if (!raw) return false;
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return ids.includes(userId);
}

