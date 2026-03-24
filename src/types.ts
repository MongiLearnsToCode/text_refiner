export interface PromptVersion {
  id: string;
  label: string;
  text: string;
  timestamp: number;
}

export type ToneOption = 'Professional' | 'Casual' | 'Persuasive' | 'Academic' | 'Empathetic';
