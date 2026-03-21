import aiEnrichmentStore from '../stores/aiEnrichmentStore';
import type { SuggestionStatus } from '../types/aiEnrichment';

export function useSuggestions() {
  return {
    suggestions: aiEnrichmentStore.suggestions,
    diffSuggestions: aiEnrichmentStore.diffSuggestions,
    acceptedSuggestions: aiEnrichmentStore.acceptedSuggestions,
    pendingSuggestions: aiEnrichmentStore.pendingSuggestions,
    rejectedSuggestions: aiEnrichmentStore.rejectedSuggestions,
    setSuggestionStatus: (id: string, status: SuggestionStatus) => aiEnrichmentStore.setSuggestionStatus(id, status),
    updateSuggestionConfig: aiEnrichmentStore.updateSuggestionConfig.bind(aiEnrichmentStore),
    acceptAll: aiEnrichmentStore.acceptAll.bind(aiEnrichmentStore),
    rejectAll: aiEnrichmentStore.rejectAll.bind(aiEnrichmentStore),
    removeRejected: aiEnrichmentStore.removeRejected.bind(aiEnrichmentStore)
  };
}
