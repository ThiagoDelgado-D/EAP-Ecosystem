import type { Tone } from '@shared/utils/tone';

export interface Topic {
  id: string;
  name: string;
  color: Tone;
  resourceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTopicPayload {
  name: string;
  color?: Tone;
}

export interface UpdateTopicPayload {
  name?: string;
  color?: Tone;
}
