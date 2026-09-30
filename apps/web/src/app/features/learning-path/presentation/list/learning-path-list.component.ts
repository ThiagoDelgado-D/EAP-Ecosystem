import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { LearningPathService } from '@features/learning-path/application/learning-path.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import {
  PATH_MODE,
  type LearningPathNode,
  type LearningPathWithNodes,
} from '@features/learning-path/domain/learning-path.model';
import { RevealDirective } from '@shared/components/reveal/reveal.directive';
import { CreateLearningPathWizardComponent } from '../create-wizard/create-learning-path-wizard.component';

const PATH_TONES = ['pine', 'ochre', 'ember', 'info', 'plum'] as const;

function sortedNodes(entry: LearningPathWithNodes): LearningPathNode[] {
  return [...entry.nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

@Component({
  selector: 'app-learning-path-list',
  standalone: true,
  templateUrl: './learning-path-list.component.html',
  providers: [
    LearningPathService,
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
  ],
  imports: [RouterModule, RevealDirective],
})
export class LearningPathListComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  readonly pathService = inject(LearningPathService);

  readonly PATH_MODE = PATH_MODE;
  readonly Math = Math;

  readonly entries = computed(() =>
    this.pathService
      .pathsWithNodes()
      .map((entry) => ({ entry, nodes: sortedNodes(entry) })),
  );

  readonly totals = computed(() => {
    const entries = this.entries();
    const steps = entries.reduce((sum, { nodes }) => sum + nodes.length, 0);
    const done = entries.reduce(
      (sum, { nodes }) => sum + nodes.filter((n) => n.progress === 'done').length,
      0,
    );
    return { paths: entries.length, steps, done };
  });

  ngOnInit(): void {
    void this.pathService.loadAllWithNodes();
  }

  async openCreateWizard(): Promise<void> {
    const dialogRef = this.dialog.open(CreateLearningPathWizardComponent, {
      panelClass: 'lp-wizard-dialog',
      autoFocus: false,
      maxWidth: 'none',
    });

    const created = await firstValueFrom(dialogRef.afterClosed());
    if (created) {
      this.pathService.paths.update((paths) => [...paths, created]);
      void this.pathService.loadAllWithNodes();
    }
  }

  toneFor(title: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i += 1) h = (h * 31 + title.charCodeAt(i)) % PATH_TONES.length;
    return PATH_TONES[h]!;
  }

  toneVar(tone: string): string {
    return `var(--tone-${tone})`;
  }

  progressPct(nodes: LearningPathNode[]): number {
    if (nodes.length === 0) return 0;
    const done = nodes.filter((n) => n.progress === 'done').length;
    return Math.round((done / nodes.length) * 100);
  }

  doneCount(nodes: LearningPathNode[]): number {
    return nodes.filter((n) => n.progress === 'done').length;
  }

  nextNode(nodes: LearningPathNode[]): LearningPathNode | null {
    return nodes.find((n) => n.progress !== 'done') ?? null;
  }
}
