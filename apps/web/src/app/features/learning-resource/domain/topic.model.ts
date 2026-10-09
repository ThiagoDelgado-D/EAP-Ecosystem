import type { Tone } from '@shared/utils/tone';

export interface Topic {
  id: string;
  name: string;
  color: Tone;
  createdAt: Date;
  updatedAt: Date;
}
