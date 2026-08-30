import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { LearningPathService } from '@features/learning-path/application/learning-path.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import { PATH_MODE, type LearningPath } from '@features/learning-path/domain/learning-path.model';
import { CreateLearningPathWizardComponent } from '../create-wizard/create-learning-path-wizard.component';

@Component({
  selector: 'app-learning-path-list',
  standalone: true,
  templateUrl: './learning-path-list.component.html',
  providers: [
    LearningPathService,
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
  ],
  imports: [RouterModule],
})
export class LearningPathListComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  readonly pathService = inject(LearningPathService);

  readonly PATH_MODE = PATH_MODE;

  ngOnInit(): void {
    void this.pathService.loadAll();
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
    }
  }

  progressPct(path: LearningPath): number {
    const stats = path.stats;
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.done / stats.total) * 100);
  }

  stubsCount(path: LearningPath): number {
    const stats = path.stats;
    if (!stats) return 0;
    return stats.total - stats.linked;
  }
}
