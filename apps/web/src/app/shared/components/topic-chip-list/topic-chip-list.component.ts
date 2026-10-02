import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TopicChip {
  id: string;
  name: string;
}

@Component({
  selector: 'app-topic-chip-list',
  standalone: true,
  templateUrl: './topic-chip-list.component.html',
})
export class TopicChipListComponent {
  @Input({ required: true }) topics!: TopicChip[];
  @Input({ required: true }) selectedIds!: string[];
  @Output() toggled = new EventEmitter<string>();

  isSelected(topicId: string): boolean {
    return this.selectedIds.includes(topicId);
  }
}
