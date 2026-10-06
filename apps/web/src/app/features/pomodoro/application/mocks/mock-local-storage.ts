import { vi } from 'vitest';

export interface MockedLocalStorage {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
}

export function mockLocalStorage(storedValue: string | null = null): MockedLocalStorage {
  return {
    getItem: vi.fn(() => storedValue),
    setItem: vi.fn(),
  };
}

export function mockThrowingLocalStorage(): MockedLocalStorage {
  const throwStorageBlocked = () => {
    throw new Error('storage blocked');
  };
  return {
    getItem: vi.fn(throwStorageBlocked),
    setItem: vi.fn(throwStorageBlocked),
  };
}

export function inMemoryLocalStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}
