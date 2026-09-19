import { vi } from 'vitest';

export interface MockedAudioInstance {
  src: string;
  volume: number;
  play: ReturnType<typeof vi.fn>;
}

export interface MockedAudio {
  AudioCtor: new (src: string) => MockedAudioInstance;
  instances: MockedAudioInstance[];
}

export function mockAudio(): MockedAudio {
  const instances: MockedAudioInstance[] = [];

  class FakeAudio {
    volume = 1;
    play = vi.fn(() => Promise.resolve());
    constructor(public src: string) {
      instances.push(this);
    }
  }

  return { AudioCtor: FakeAudio, instances };
}

export function mockBlockedAudio(): new (src: string) => MockedAudioInstance {
  class BlockedAudio {
    volume = 1;
    play = vi.fn(() => Promise.reject(new Error('autoplay blocked')));
    constructor(public src: string) {}
  }
  return BlockedAudio;
}

export function mockThrowingAudio(): new (src: string) => MockedAudioInstance {
  function ThrowingAudio(): void {
    throw new Error('audio unavailable');
  }
  return ThrowingAudio as unknown as new (src: string) => MockedAudioInstance;
}
