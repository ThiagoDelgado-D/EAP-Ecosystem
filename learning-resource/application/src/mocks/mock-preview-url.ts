import type {
  IUrlMetadataService,
  UrlMetadata,
} from "../ports/IUrl-metadata-service.js";

export interface MockedUrlMetadataService extends IUrlMetadataService {
  responses: Map<string, UrlMetadata | Error>;
  setResponse(url: string, metadata: UrlMetadata): void;
  setError(url: string, error: Error): void;
  clear(): void;
  reset(): void;
}

export function mockUrlMetadataService(): MockedUrlMetadataService {
  const responses = new Map<string, UrlMetadata | Error>();

  return {
    responses,

    async extract(url: string): Promise<UrlMetadata> {
      const response = responses.get(url);
      if (response instanceof Error) {
        throw response;
      }
      if (response !== undefined) {
        return response;
      }
      return {};
    },

    setResponse(url: string, metadata: UrlMetadata): void {
      responses.set(url, metadata);
    },

    setError(url: string, error: Error): void {
      responses.set(url, error);
    },

    clear(): void {
      responses.clear();
    },

    reset(): void {
      responses.clear();
    },
  };
}
