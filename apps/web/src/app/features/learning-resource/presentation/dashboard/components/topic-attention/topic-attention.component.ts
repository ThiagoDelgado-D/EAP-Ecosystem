import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface TopicLoad {
  id: string;
  name: string;
  pendingMinutes: number;
}

function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

@Component({
  selector: 'app-topic-attention',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topic-attention.component.html',
})
export class TopicAttentionComponent {
  readonly topics = input.required<TopicLoad[]>();

  maxMinutes(): number {
    return Math.max(1, ...this.topics().map((t) => t.pendingMinutes));
  }

  widthPct(minutes: number): number {
    return Math.max(4, (minutes / this.maxMinutes()) * 100);
  }

  minutesLabel(minutes: number): string {
    return minutesLabel(minutes);
  }
}
