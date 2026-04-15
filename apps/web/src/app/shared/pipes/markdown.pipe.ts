import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  async transform(value: string | null | undefined): Promise<string> {
    if (!value) return '';
    const html = await marked.parse(value);
    return html;
  }
}
