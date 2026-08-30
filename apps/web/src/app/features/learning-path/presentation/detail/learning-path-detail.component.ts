import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogService } from '@core/dialogs/confirm-dialog.service';
import { ToastService } from '@core/toast/toast.service';
import { LearningPathDetailService } from '@features/learning-path/application/learning-path-detail.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import {
  NODE_PROGRESS,
  PATH_MODE,
  type LearningPathNode,
  type NodeProgress,
  type PathMode,
} from '@features/learning-path/domain/learning-path.model';
import { NodeFormDialogComponent } from '../node-form/node-form-dialog.component';
import { EditLearningPathDialogComponent } from '../edit-path/edit-learning-path-dialog.component';
import { NodeDetailPanelComponent } from '../node-panel/node-detail-panel.component';

@Component({
  selector: 'app-learning-path-detail',
  standalone: true,
  templateUrl: './learning-path-detail.component.html',
  providers: [
    LearningPathDetailService,
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
  ],
  imports: [RouterModule, CdkDropList, CdkDrag, CdkDragHandle, NodeDetailPanelComponent],
})
export class LearningPathDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);
  readonly detailService = inject(LearningPathDetailService);

  readonly PATH_MODE = PATH_MODE;
  readonly NODE_PROGRESS = NODE_PROGRESS;

  readonly pathId = this.route.snapshot.paramMap.get('id')!;

  readonly sortedNodes = computed(() => {
    const nodes = this.detailService.data()?.nodes ?? [];
    return [...nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  readonly progressPercent = computed(() => {
    const nodes = this.detailService.data()?.nodes ?? [];
    if (nodes.length === 0) return 0;
    const done = nodes.filter((n) => n.progress === NODE_PROGRESS.DONE).length;
    return Math.floor((done / nodes.length) * 100);
  });

  readonly doneCount = computed(
    () => (this.detailService.data()?.nodes ?? []).filter((n) => n.progress === NODE_PROGRESS.DONE)
      .length,
  );
  readonly totalCount = computed(() => (this.detailService.data()?.nodes ?? []).length);
  readonly linkedCount = computed(
    () => (this.detailService.data()?.nodes ?? []).filter((n) => !!n.learningResourceId).length,
  );
  readonly stubsCount = computed(() => this.totalCount() - this.linkedCount());

  readonly activeNodeId = computed(
    () => this.sortedNodes().find((n) => n.progress === NODE_PROGRESS.IN_PROGRESS)?.id ?? null,
  );

  private readonly viewModeOverride = signal<PathMode | null>(null);
  readonly viewMode = computed(
    () => this.viewModeOverride() ?? this.detailService.data()?.path.mode ?? PATH_MODE.SEQUENTIAL,
  );

  setViewMode(mode: PathMode): void {
    this.viewModeOverride.set(mode);
  }

  readonly reordering = signal(false);
  private readonly selectedNodeId = signal<string | null>(null);
  readonly selectedNode = computed(
    () => (this.detailService.data()?.nodes ?? []).find((n) => n.id === this.selectedNodeId()) ?? null,
  );

  openNodePanel(node: LearningPathNode): void {
    this.selectedNodeId.set(node.id);
  }

  closeNodePanel(): void {
    this.selectedNodeId.set(null);
  }

  ngOnInit(): void {
    void this.detailService.load(this.pathId);
  }

  async openEditPath(): Promise<void> {
    const path = this.detailService.data()?.path;
    if (!path) return;

    const dialogRef = this.dialog.open(EditLearningPathDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
      width: '480px',
      data: { path },
    });
    const updated = await firstValueFrom(dialogRef.afterClosed());
    if (updated) {
      this.detailService.updatePathInState(updated);
      this.toastService.show('Learning Path actualizado', 'success');
    }
  }

  async openAddNode(): Promise<void> {
    const dialogRef = this.dialog.open(NodeFormDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
      width: '480px',
      data: { pathId: this.pathId },
    });
    const node = await firstValueFrom(dialogRef.afterClosed());
    if (node) {
      this.detailService.upsertNodeInState(node);
      this.toastService.show('Nodo agregado', 'success');
    }
  }

  async openEditNode(node: LearningPathNode): Promise<void> {
    const dialogRef = this.dialog.open(NodeFormDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
      width: '480px',
      data: { pathId: this.pathId, node },
    });
    const updated = await firstValueFrom(dialogRef.afterClosed());
    if (updated) {
      this.detailService.upsertNodeInState(updated);
      this.toastService.show('Nodo actualizado', 'success');
    }
  }

  async removeNode(node: LearningPathNode): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar nodo',
      message: `¿Seguro que querés eliminar "${node.title}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      confirmButtonClass: 'bg-red-600 hover:bg-red-500 text-white',
    });
    if (!confirmed) return;

    try {
      await this.detailService.deleteNode(this.pathId, node.id);
      this.toastService.show('Nodo eliminado', 'success');
    } catch {
      this.toastService.show('No se pudo eliminar el nodo', 'error');
    }
  }

  async setProgress(node: LearningPathNode, progress: NodeProgress): Promise<void> {
    if (node.progress === progress) return;
    try {
      await this.detailService.updateNodeProgress(this.pathId, node.id, progress);
    } catch {
      this.toastService.show('No se pudo actualizar el progreso', 'error');
    }
  }

  async advanceProgress(node: LearningPathNode): Promise<void> {
    const cycle: NodeProgress[] = [NODE_PROGRESS.PENDING, NODE_PROGRESS.IN_PROGRESS, NODE_PROGRESS.DONE];
    const next = cycle[(cycle.indexOf(node.progress) + 1) % cycle.length];
    await this.setProgress(node, next);
  }

  async onDrop(event: CdkDragDrop<LearningPathNode[]>): Promise<void> {
    const reordered = [...this.sortedNodes()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    this.reordering.set(true);
    try {
      await this.detailService.reorderNodes(this.pathId, reordered);
    } catch {
      this.toastService.show('No se pudo reordenar los nodos', 'error');
    } finally {
      this.reordering.set(false);
    }
  }

  async removePath(): Promise<void> {
    const path = this.detailService.data()?.path;
    if (!path) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Learning Path',
      message: `¿Seguro que querés eliminar "${path.title}"? Se van a borrar todos sus nodos y conexiones. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      confirmButtonClass: 'bg-red-600 hover:bg-red-500 text-white',
    });
    if (!confirmed) return;

    try {
      await this.detailService.deletePath(this.pathId);
      this.toastService.show('Learning Path eliminado', 'success');
      this.router.navigate(['/paths']);
    } catch {
      this.toastService.show('No se pudo eliminar el Learning Path', 'error');
    }
  }
}
