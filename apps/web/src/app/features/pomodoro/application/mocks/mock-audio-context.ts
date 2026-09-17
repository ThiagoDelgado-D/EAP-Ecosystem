import { vi } from 'vitest';

export interface MockedAudioContext {
  AudioContextCtor: new () => unknown;
  oscillator: {
    type: string;
    frequency: { value: number };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };
  gain: {
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  };
  instances: unknown[];
}

export function mockAudioContext(): MockedAudioContext {
  const instances: unknown[] = [];
  const gain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const oscillator = {
    type: '',
    frequency: { value: 0 },
    connect: vi.fn(() => gain),
    start: vi.fn(),
    stop: vi.fn(),
  };

  class FakeAudioContext {
    currentTime = 0;
    destination = {};
    constructor() {
      instances.push(this);
    }
    createOscillator() {
      return oscillator;
    }
    createGain() {
      return gain;
    }
  }

  return { AudioContextCtor: FakeAudioContext, oscillator, gain, instances };
}

export function mockThrowingAudioContext(): new () => unknown {
  return class {
    constructor() {
      throw new Error('autoplay blocked');
    }
  };
}
