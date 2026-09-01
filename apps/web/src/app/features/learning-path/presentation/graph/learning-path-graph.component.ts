import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { select } from 'd3-selection';
import { zoom, type ZoomBehavior } from 'd3-zoom';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import {
  NODE_PROGRESS,
  type LearningPathEdge,
  type LearningPathNode,
} from '@features/learning-path/domain/learning-path.model';

interface CanvasPosition {
  x: number;
  y: number;
}

interface SimNode {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

const LAYOUT_TICKS = 300;
const LINK_DISTANCE = 140;
const CHARGE_STRENGTH = -300;
const COLLIDE_RADIUS = 70;

/** Below this, a pointerdown/up pair on a node is a click, not a drag — d3-zoom style. */
const DRAG_CLICK_THRESHOLD = 4;

interface EdgeDraft {
  sourceNodeId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'app-learning-path-graph',
  standalone: true,
  templateUrl: './learning-path-graph.component.html',
})
export class LearningPathGraphComponent implements AfterViewInit {
  readonly NODE_PROGRESS = NODE_PROGRESS;

  readonly nodes = input.required<LearningPathNode[]>();
  readonly edges = input.required<LearningPathEdge[]>();
  readonly nodeSelected = output<LearningPathNode>();
  readonly nodeMoved = output<{ node: LearningPathNode; x: number; y: number }>();
  readonly edgeCreateRequested = output<{ sourceNodeId: string; targetNodeId: string }>();
  readonly edgeClicked = output<LearningPathEdge>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLDivElement>>('canvas');

  private readonly positions = signal<Record<string, CanvasPosition>>({});
  readonly transform = signal({ x: 0, y: 0, k: 1 });

  // Plain fields, not signals: only read synchronously inside the pointermove/up
  // handlers of the same gesture, never rendered directly.
  private draggingNodeId: string | null = null;
  private dragMoved = false;
  private dragStartClient: CanvasPosition = { x: 0, y: 0 };
  private dragStartNodePos: CanvasPosition = { x: 0, y: 0 };

  private edgeDragSourceId: string | null = null;
  readonly edgeDraft = signal<EdgeDraft | null>(null);

  readonly positionedNodes = computed(() => {
    const positions = this.positions();
    return this.nodes()
      .map((node) => {
        const position = positions[node.id];
        return position ? { node, x: position.x, y: position.y } : null;
      })
      .filter((entry): entry is { node: LearningPathNode; x: number; y: number } => entry !== null);
  });

  readonly edgeLines = computed(() => {
    const positions = this.positions();
    return this.edges()
      .map((edge) => {
        const source = positions[edge.sourceNodeId];
        const target = positions[edge.targetNodeId];
        return source && target ? { edge, x1: source.x, y1: source.y, x2: target.x, y2: target.y } : null;
      })
      .filter(
        (
          entry,
        ): entry is { edge: LearningPathEdge; x1: number; y1: number; x2: number; y2: number } =>
          entry !== null,
      );
  });

  constructor() {
    // `positions` is read (and written) inside `computeLayout`, so it's read here
    // via `untracked` — otherwise writing it would re-trigger this same effect forever.
    effect(() => {
      const currentNodes = this.nodes();
      const currentEdges = this.edges();
      untracked(() => this.computeLayout(currentNodes, currentEdges));
    });
  }

  ngAfterViewInit(): void {
    this.setUpZoom();
  }

  onNodeClick(node: LearningPathNode): void {
    this.nodeSelected.emit(node);
  }

  onNodePointerDown(event: PointerEvent, node: LearningPathNode, x: number, y: number): void {
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.draggingNodeId = node.id;
    this.dragMoved = false;
    this.dragStartClient = { x: event.clientX, y: event.clientY };
    this.dragStartNodePos = { x, y };
  }

  onNodePointerMove(event: PointerEvent, node: LearningPathNode): void {
    if (this.draggingNodeId !== node.id) return;
    const dx = event.clientX - this.dragStartClient.x;
    const dy = event.clientY - this.dragStartClient.y;
    if (!this.dragMoved && Math.hypot(dx, dy) < DRAG_CLICK_THRESHOLD) return;
    this.dragMoved = true;

    const k = this.transform().k;
    const next = { x: this.dragStartNodePos.x + dx / k, y: this.dragStartNodePos.y + dy / k };
    this.positions.update((prev) => ({ ...prev, [node.id]: next }));
  }

  onNodePointerUp(event: PointerEvent, node: LearningPathNode): void {
    if (this.draggingNodeId !== node.id) return;
    (event.currentTarget as Element).releasePointerCapture(event.pointerId);
    this.draggingNodeId = null;

    if (!this.dragMoved) {
      this.onNodeClick(node);
      return;
    }
    const { x, y } = this.positions()[node.id];
    this.nodeMoved.emit({ node, x, y });
  }

  onNodePointerCancel(): void {
    this.draggingNodeId = null;
  }

  onEdgeHandlePointerDown(
    event: PointerEvent,
    node: LearningPathNode,
    x: number,
    y: number,
  ): void {
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.edgeDragSourceId = node.id;
    this.edgeDraft.set({ sourceNodeId: node.id, x1: x, y1: y, x2: x, y2: y });
  }

  onEdgeHandlePointerMove(event: PointerEvent): void {
    if (!this.edgeDragSourceId) return;
    const { x, y } = this.toWorldCoords(event.clientX, event.clientY);
    this.edgeDraft.update((draft) => (draft ? { ...draft, x2: x, y2: y } : draft));
  }

  onEdgeHandlePointerUp(event: PointerEvent): void {
    const sourceNodeId = this.edgeDragSourceId;
    if (!sourceNodeId) return;
    (event.currentTarget as Element).releasePointerCapture(event.pointerId);
    this.edgeDragSourceId = null;
    this.edgeDraft.set(null);

    const targetCard = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-node-card]');
    const targetNodeId = targetCard?.dataset['nodeId'];
    if (!targetNodeId || targetNodeId === sourceNodeId) return;

    const alreadyLinked = this.edges().some(
      (e) => e.sourceNodeId === sourceNodeId && e.targetNodeId === targetNodeId,
    );
    if (alreadyLinked) return;

    this.edgeCreateRequested.emit({ sourceNodeId, targetNodeId });
  }

  onEdgeLineClick(edge: LearningPathEdge, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.edgeClicked.emit(edge);
  }

  private toWorldCoords(clientX: number, clientY: number): CanvasPosition {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    const { x, y, k } = this.transform();
    return { x: (clientX - rect.left - x) / k, y: (clientY - rect.top - y) / k };
  }

  /**
   * One-shot layout pass, not a live-ticking simulation: most nodes already have a
   * saved position, so a perpetually-running `forceSimulation` would just burn CPU
   * on an animation frame timer forever with nothing left to animate. Already-placed
   * nodes are pinned via fx/fy so only new/unpositioned nodes get arranged.
   */
  private computeLayout(currentNodes: LearningPathNode[], currentEdges: LearningPathEdge[]): void {
    const existing = this.positions();

    const simNodes: SimNode[] = currentNodes.map((node) => {
      const placedX = node.x ?? existing[node.id]?.x;
      const placedY = node.y ?? existing[node.id]?.y;
      return { id: node.id, x: placedX, y: placedY, fx: placedX ?? null, fy: placedY ?? null };
    });

    const hasUnplacedNode = simNodes.some((n) => n.fx == null || n.fy == null);
    if (!hasUnplacedNode) {
      this.positions.set(this.toPositionMap(simNodes));
      return;
    }

    const simLinks = currentEdges.map((edge) => ({
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
    }));

    const simulation = forceSimulation(simNodes)
      .force(
        'link',
        forceLink(simLinks)
          .id((d: unknown) => (d as SimNode).id)
          .distance(LINK_DISTANCE),
      )
      .force('charge', forceManyBody().strength(CHARGE_STRENGTH))
      .force('center', forceCenter(300, 250))
      .force('collide', forceCollide(COLLIDE_RADIUS))
      .stop();

    for (let i = 0; i < LAYOUT_TICKS; i++) simulation.tick();

    this.positions.set(this.toPositionMap(simNodes));
  }

  private toPositionMap(simNodes: SimNode[]): Record<string, CanvasPosition> {
    const next: Record<string, CanvasPosition> = {};
    for (const n of simNodes) next[n.id] = { x: n.x ?? 0, y: n.y ?? 0 };
    return next;
  }

  private setUpZoom(): void {
    const container = this.canvasRef().nativeElement;
    const zoomBehavior: ZoomBehavior<HTMLDivElement, unknown> = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.25, 2.5])
      .filter((event: Event) => !(event.target as HTMLElement).closest('[data-node-card]'))
      .on('zoom', (event) => {
        this.transform.set({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });
    select(container).call(zoomBehavior);
  }
}
