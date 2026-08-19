export function shouldVoidShowcaseAtSubmissionClose(validEntryCount: number): boolean {
  return validEntryCount < 2;
}
