export const MAX_ENTRY_COMMENT_TIMESTAMP_SECONDS = 24 * 60 * 60;

export function isValidCommentTimestamp(timestampSeconds: number): boolean {
  return (
    Number.isFinite(timestampSeconds) &&
    timestampSeconds >= 0 &&
    timestampSeconds <= MAX_ENTRY_COMMENT_TIMESTAMP_SECONDS
  );
}

// Assigns stable "Commenter N" aliases in first-seen order, so blind judging hides
// commenter identity the same way it hides Participant identity.
export function assignAnonymousCommentAuthorAliases(
  authorUserIdsInChronologicalOrder: readonly string[],
): Map<string, string> {
  const aliasesByAuthorUserId = new Map<string, string>();

  for (const authorUserId of authorUserIdsInChronologicalOrder) {
    if (!aliasesByAuthorUserId.has(authorUserId)) {
      aliasesByAuthorUserId.set(authorUserId, `Commenter ${aliasesByAuthorUserId.size + 1}`);
    }
  }

  return aliasesByAuthorUserId;
}
