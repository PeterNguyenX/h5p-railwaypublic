import axios from 'axios';
import type { AnalyzeResponse, TranscriptSegment } from '../../types/aiEnrichment';

export async function analyzeTranscript(videoId: string, segments: TranscriptSegment[]): Promise<AnalyzeResponse> {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    '/api/ai/analyze',
    { videoId, segments },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data as AnalyzeResponse;
}
