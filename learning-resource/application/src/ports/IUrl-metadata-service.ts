export interface UrlMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  resourceTypeCode?: string;
  author?: string;
  siteName?: string;
}

export interface IUrlMetadataService {
  extract(url: string): Promise<UrlMetadata>;
}
