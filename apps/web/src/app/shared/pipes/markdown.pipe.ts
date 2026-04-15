import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  async transform(value: string | null | undefined): Promise<string> {
    if (!value) return '';

    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    const rawHtml = await marked.parse(value);
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return cleanHtml;
  }
}
