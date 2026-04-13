export interface MappedFields {
  title: string;
  url?: string;
  resourceTypeCode?: string;
  notes?: string;
}

const TYPE_KEYWORDS: Record<string, string> = {
  video: 'video',
  videos: 'video',
  youtube: 'video',
  vimeo: 'video',
  article: 'article',
  artículo: 'article',
  articulo: 'article',
  blog: 'article',
  post: 'article',
  book: 'book',
  libro: 'book',
  libros: 'book',
  course: 'course',
  curso: 'course',
  cursos: 'course',
  podcast: 'podcast',
  document: 'document',
  documento: 'document',
  repo: 'document',
  repository: 'document',
  github: 'document',
};

const URL_PATTERN = /https?:\/\/[^\s]+/gi;

export function parseTranscript(transcript: string): MappedFields {
  const text = transcript.trim();

  const urlMatch = text.match(URL_PATTERN);
  const url = urlMatch?.[0];

  const textWithoutUrl = url ? text.replace(url, '').trim() : text;

  const words = textWithoutUrl.toLowerCase().split(/\s+/);
  let resourceTypeCode: string | undefined;
  const consumedIndices = new Set<number>();

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[.,!?]/g, '');
    if (TYPE_KEYWORDS[word]) {
      resourceTypeCode = TYPE_KEYWORDS[word];
      consumedIndices.add(i);
      break;
    }
  }

  const titleWords = textWithoutUrl.split(/\s+/).filter((_, i) => !consumedIndices.has(i));

  const title = titleWords.join(' ').trim() || text;

  return { title, url, resourceTypeCode };
}
