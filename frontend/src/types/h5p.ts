export type H5PType = 'MultiChoice' | 'TrueFalse' | 'FillBlanks' | 'Hotspot' | 'DragDrop';

export interface H5PSuggestionConfig {
  [key: string]: unknown;
}

export interface H5PSuggestion {
  id: string;
  timestamp: number;
  type: H5PType;
  config: H5PSuggestionConfig;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}
