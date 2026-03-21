import aiEnrichmentStore from '../stores/aiEnrichmentStore';

export function useTranscriptAnalysis() {
  return {
    segments: aiEnrichmentStore.segments,
    transcriptFilename: aiEnrichmentStore.transcriptFilename,
    isAnalyzing: aiEnrichmentStore.isAnalyzing,
    progressMessage: aiEnrichmentStore.progressMessage,
    rawAiResponse: aiEnrichmentStore.rawAiResponse,
    parseTranscript: aiEnrichmentStore.parseTranscript.bind(aiEnrichmentStore),
    analyzeStreaming: aiEnrichmentStore.analyzeStreaming.bind(aiEnrichmentStore),
    analyzeNonStreaming: aiEnrichmentStore.analyzeNonStreaming.bind(aiEnrichmentStore)
  };
}
