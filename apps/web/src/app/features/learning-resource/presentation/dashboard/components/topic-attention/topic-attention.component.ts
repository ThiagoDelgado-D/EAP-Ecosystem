import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { minutesLabel } from '@shared/utils/minutes-label';

export interface TopicLoad {
  id: string;
  name: string;
  pendingMinutes: number;
  color?: string;
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

  readonly minutesLabel = minutesLabel;
}
