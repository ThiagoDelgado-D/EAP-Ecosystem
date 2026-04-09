import * as cheerio from "cheerio";
import type {
  IUrlMetadataService,
  UrlMetadata,
} from "@learning-resource/application";

const OEMBED_PROVIDERS: Record<string, string> = {
  "youtube.com": "https://www.youtube.com/oembed",
  "youtu.be": "https://www.youtube.com/oembed",
  "vimeo.com": "https://vimeo.com/api/oembed.json",
};

const FETCH_TIMEOUT_MS = 5000;

export class UrlMetadataService implements IUrlMetadataService {
  async extract(url: string): Promise<UrlMetadata> {
    const oembedResult = await this.tryOEmbed(url);
    if (oembedResult) return oembedResult;

    const ogResult = await this.tryOpenGraph(url);
    if (ogResult) return ogResult;

    return {};
  }

  private isPrivateUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.16.") ||
        hostname === "0.0.0.0" ||
        hostname.endsWith(".local")
      );
    } catch {
      return true;
    }
  }

  private async tryOEmbed(url: string): Promise<UrlMetadata | null> {
    if (this.isPrivateUrl(url)) return null;
    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      const endpoint = OEMBED_PROVIDERS[hostname];
      if (!endpoint) return null;

      const oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) return null;

      const data = (await response.json()) as Record<string, unknown>;

      return {
        title: typeof data["title"] === "string" ? data["title"] : undefined,
        imageUrl:
          typeof data["thumbnail_url"] === "string"
            ? data["thumbnail_url"]
            : undefined,
        author:
          typeof data["author_name"] === "string"
            ? data["author_name"]
            : undefined,
        siteName:
          typeof data["provider_name"] === "string"
            ? data["provider_name"]
            : undefined,
        resourceTypeCode: data["type"] === "video" ? "video" : "article",
      };
    } catch {
      return null;
    }
  }

  private async tryOpenGraph(url: string): Promise<UrlMetadata | null> {
    if (this.isPrivateUrl(url)) return null;
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "EAP-Ecosystem/1.0 (metadata-fetcher)" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) return null;

      const html = await response.text();
      const $ = cheerio.load(html);

      const getMeta = (property: string): string | undefined =>
        $(`meta[property="${property}"]`).attr("content") ??
        $(`meta[name="${property}"]`).attr("content");

      return {
        title: getMeta("og:title") ?? $("title").text() ?? undefined,
        description: getMeta("og:description") ?? getMeta("description"),
        imageUrl: getMeta("og:image"),
        siteName: getMeta("og:site_name"),
        resourceTypeCode: this.inferResourceTypeCode(url, getMeta("og:type")),
      };
    } catch {
      return null;
    }
  }

  private inferResourceTypeCode(url: string, ogType?: string): string {
    if (
      ogType === "video" ||
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com")
    ) {
      return "video";
    }
    if (url.includes("github.com")) return "document";
    return "article";
  }
}
