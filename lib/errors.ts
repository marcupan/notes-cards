export function friendlyError(err: unknown): string {
  const msg = (err as any)?.message || String(err) || "Unexpected error";
  const code = String(msg);
  switch (true) {
    case /UNAUTHORIZED/.test(code):
      return "Please sign in to continue.";
    case /FORBIDDEN/.test(code):
      return "You don’t have permission for this.";
    case /NOT_FOUND/.test(code):
      return "Item not found or already removed.";
    case /FOLDER_NOT_EMPTY/.test(code):
      return "Folder isn’t empty. Move or delete its cards first.";
    case /INVALID_FOLDER_NAME/.test(code):
      return "Folder name must be 1–50 characters.";
    case /FOLDER_NAME_EXISTS/.test(code):
      return "You already have a folder with that name.";
    case /DUPLICATE_CARD/.test(code):
      return "You already have a card for this word in the folder.";
    case /RATE_LIMITED/.test(code):
      return "You’ve hit the limit (5/min, 20/day). Try later.";
    case /INVALID_AI_RESPONSE/.test(code):
      return "Couldn’t understand AI response. Please try again.";
    case /AI_CALL_FAILED/.test(code):
      return "AI service failed. Check connection and try again.";
    case /SERVER_MISCONFIGURED/.test(code):
      return "Server missing configuration. Contact support.";
    case /INVALID_ORIGINAL_WORD/.test(code):
      return "Enter a valid Chinese word.";
    case /INVALID_TRANSLATION/.test(code):
      return "Translation is required.";
    case /INVALID_EXAMPLE_SENTENCES/.test(code):
      return "Exactly 3 example sentences are required.";
    case /OPENAI_ERROR_/.test(code):
      return "AI provider returned an error.";
    default:
      return code;
  }
}
