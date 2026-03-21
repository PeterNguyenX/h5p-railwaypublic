import axios from 'axios';
import type { AISuggestion, InjectResponse } from '../../types/aiEnrichment';

export async function injectSuggestions(videoId: string, suggestions: AISuggestion[]): Promise<InjectResponse> {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    '/api/ai/inject',
    { videoId, suggestions },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data as InjectResponse;
}
