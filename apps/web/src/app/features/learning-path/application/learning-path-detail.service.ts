import { inject, Injectable, signal } from '@angular/core';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import type {
  LearningPath,
  LearningPathNode,
  LearningPathWithNodes,
  NodeProgress,
} from '@features/learning-path/domain/learning-path.model';

@Injectable()
export class LearningPathDetailService {
  private readonly repository = inject(LearningPathRepository);

  readonly data = signal<LearningPathWithNodes | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(pathId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.repository.getById(pathId);
      this.data.set(data);
    } catch {
      this.error.set('No pudimos cargar este Learning Path.');
    } finally {
      this.loading.set(false);
    }
  }

  updatePathInState(path: LearningPath): void {
    this.data.update((current) => (current ? { ...current, path } : current));
  }

  /** Inserts a new node or replaces an existing one by id — used after the add/edit dialog closes. */
  upsertNodeInState(node: LearningPathNode): void {
    this.patchNodes((nodes) => {
      const index = nodes.findIndex((n) => n.id === node.id);
      if (index === -1) return [...nodes, node];
      const copy = [...nodes];
      copy[index] = node;
      return copy;
    });
  }

  async deleteNode(pathId: string, nodeId: string): Promise<void> {
    await this.repository.deleteNode(pathId, nodeId);
    this.patchNodes((nodes) => nodes.filter((n) => n.id !== nodeId));
  }

  async updateNodeProgress(pathId: string, nodeId: string, progress: NodeProgress): Promise<void> {
    const previous = this.data()?.nodes;
    if (!previous) return;
    // Optimistic update, revert on failure — same pattern as PreferencesService's toggles.
    this.patchNodes((nodes) => nodes.map((n) => (n.id === nodeId ? { ...n, progress } : n)));
    try {
      await this.repository.updateNodeProgress(pathId, nodeId, progress);
    } catch {
      this.patchNodes(() => previous);
      throw new Error('No se pudo actualizar el progreso.');
    }
  }

  async updateNodePosition(pathId: string, nodeId: string, x: number, y: number): Promise<void> {
    const previous = this.data()?.nodes;
    if (!previous) return;
    this.patchNodes((nodes) => nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
    try {
      await this.repository.updateNodePosition(pathId, nodeId, x, y);
    } catch {
      this.patchNodes(() => previous);
      throw new Error('No se pudo guardar la posición del nodo.');
    }
  }

  async reorderNodes(pathId: string, orderedNodes: LearningPathNode[]): Promise<void> {
    const previous = this.data()?.nodes;
    if (!previous) return;
    const previousOrderById = new Map(previous.map((node) => [node.id, node.order]));
    const withOrder = orderedNodes.map((node, index) => ({ ...node, order: index }));
    this.patchNodes(() => withOrder);

    // Only PATCH nodes whose order actually moved — a 2-node swap in a 50-node
    // path shouldn't fire 50 requests.
    const changed = withOrder.filter(
      (node) => previousOrderById.get(node.id) !== node.order,
    );

    try {
      await Promise.all(
        changed.map((node) => this.repository.updateNode(pathId, node.id, { order: node.order })),
      );
    } catch {
      // Promise.all doesn't roll back requests that already succeeded, so
      // reverting to `previous` here could show an order that matches neither
      // the pre- nor post-drag state. Re-fetch from the server instead.
      await this.load(pathId);
      throw new Error('No se pudo reordenar los nodos.');
    }
  }

  async linkNode(pathId: string, nodeId: string, learningResourceId: string): Promise<void> {
    const updated = await this.repository.updateNode(pathId, nodeId, { learningResourceId });
    this.upsertNodeInState(updated);
  }

  async unlinkNode(pathId: string, nodeId: string): Promise<void> {
    const updated = await this.repository.updateNode(pathId, nodeId, { learningResourceId: null });
    this.upsertNodeInState(updated);
  }

  async deletePath(pathId: string): Promise<void> {
    await this.repository.delete(pathId);
  }

  private patchNodes(updater: (nodes: LearningPathNode[]) => LearningPathNode[]): void {
    this.data.update((current) =>
      current ? { ...current, nodes: updater(current.nodes) } : current,
    );
  }
}
