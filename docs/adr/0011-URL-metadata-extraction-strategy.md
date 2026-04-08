# ADR-0011: URL Metadata Extraction Strategy

## Status

Proposed

## Context

v0.6.0 introduces URL Import — users paste a URL and the system
auto-detects title, description, resource type, and thumbnail before saving.

The core architectural question is how to obtain this metadata reliably
without creating a hard dependency on an external service.

The sites most relevant to this use case (YouTube, Medium, Dev.to, GitHub,
any blog) all expose Open Graph meta tags in their static HTML. A subset of
them (YouTube, Vimeo) also expose oEmbed endpoints.

## Decision

Implement a three-tier extraction pipeline, executed in order:

**Tier 1 — oEmbed** (for known providers)
Query the provider's oEmbed endpoint when the URL matches a known host
(youtube.com, vimeo.com, etc.). Returns structured JSON with title, author,
thumbnail and — for video — duration. No scraping required.

**Tier 2 — Open Graph scraping** (own implementation via Cheerio)
Make a server-side HTTP GET to the URL, parse the HTML with Cheerio, and
extract og:title, og:description, og:image, og:type, and optionally
twitter:card fields. Works for any site that serves meta tags in static HTML,
which covers the vast majority of learning content sites.

**Tier 3 — External API fallback** (Microlink or equivalent)
Called only when Tiers 1 and 2 return insufficient data (e.g., JS-rendered
sites with no static meta tags). Treated as an optional enhancement — the
feature degrades gracefully to a pre-filled form with just the URL if this
tier is also unavailable.

## Resource Type Inference

Map extracted metadata to LearningResource types:

- og:type = "video" or oEmbed type = "video" → Video
- URL contains github.com → Document / Toolkit
- URL contains medium.com, dev.to, or og:type = "article" → Article
- Default → Article (user can override in the form)

## Consequences

**Positive**

- No external dependency in the critical path (Tiers 1 and 2 are self-contained)
- oEmbed is a free, stable, standardized protocol
- Open Graph scraping works for >90% of target sites
- External API is optional and easily swappable
- Feature degrades gracefully — worst case is an empty pre-filled form

**Negative**

- Tier 2 does not work for JS-rendered sites without static meta tags
- Maintaining the oEmbed provider list requires occasional updates
- HTTP GET from backend adds latency (mitigated by reasonable timeout ~5s)

## Rejected Alternatives

- **100% external API**: creates a hard runtime dependency; costs and rate
  limits become a concern at scale; feature breaks if service changes
- **Browser headless (Puppeteer)**: significantly higher infrastructure
  complexity and resource usage; not justified for the target site set
- **Client-side scraping**: blocked by CORS on virtually all external sites

## References

- Open Graph Protocol: https://ogp.me
- oEmbed spec: https://oembed.com
- Microlink API: https://microlink.io (Tier 3 candidate)
- Roadmap: v0.6.0 — URL Import
