export type EntryDraft = {
  participantId: string;
  showcaseId: string;
  requiredSampleIds: string[];
  usedSampleIds: string[];
};

export function isEntryValidForRequiredSamples(entryDraft: EntryDraft): boolean {
  if (entryDraft.requiredSampleIds.length === 0) {
    return false;
  }

  const usedSampleIdSet = new Set(entryDraft.usedSampleIds);
  return entryDraft.requiredSampleIds.every((sampleId) => usedSampleIdSet.has(sampleId));
}
