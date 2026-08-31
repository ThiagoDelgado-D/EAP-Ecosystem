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

  private readonly canvasRef = viewChild.required<ElementRef<HTMLDivElement>>('canvas');

  private readonly positions = signal<Record<string, CanvasPosition>>({});
  readonly transform = signal({ x: 0, y: 0, k: 1 });

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
