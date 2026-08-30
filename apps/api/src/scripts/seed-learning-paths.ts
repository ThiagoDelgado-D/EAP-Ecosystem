import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import {
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningPathEdgeEntity,
} from "@learning-resource/infrastructure";
import { UserEntity } from "@user/infrastructure";
import { AppDataSource } from "../database/data-source.js";

config({ path: "../../.env" });

interface NodeDef {
  key: string;
  title: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: string;
  order?: number;
}

interface PathDef {
  id?: string; // set to reuse/fill an existing path
  title: string;
  description: string;
  mode: "sequential" | "graph";
  nodes: NodeDef[];
  edges?: Array<[string, string]>; // [sourceKey, targetKey], graph mode only
}

// Existing faker-seeded learning_resources, reused here only to demo the
// "linked node" rendering path (real titles come from the node itself).
const DEMO_RESOURCE_IDS = [
  "0ecfc9dd-b544-4266-bacc-68a20861f23a",
  "da9ae7b0-a630-43e1-91d5-f013df609a0c",
  "39cd7979-e53d-465b-9484-f472aa887475",
  "cb39743b-5849-4a3f-b73c-3e5cb385532d",
  "8e714430-7fc3-4b32-af8b-5b3fdecd2bf5",
];

const paths: PathDef[] = [
  {
    id: "8c88c523-17f9-49d9-8d21-df2ac2bf51e0", // existing empty "Frontend desde cero"
    title: "Frontend desde cero",
    description:
      "Mapa amplio de fundamentos frontend — HTML/CSS/JS de base, ramificando hacia TypeScript, Angular y buenas prácticas.",
    mode: "graph",
    nodes: [
      { key: "html", title: "HTML fundamentals", externalUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
      { key: "css", title: "CSS fundamentals", externalUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
      {
        key: "js",
        title: "JavaScript fundamentals",
        externalUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      },
      { key: "git", title: "Git y control de versiones", externalUrl: "https://git-scm.com/doc" },
      {
        key: "dom",
        title: "DOM y Browser APIs",
        externalUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model",
      },
      { key: "ts", title: "TypeScript", externalUrl: "https://www.typescriptlang.org/docs/" },
      { key: "angular", title: "Angular fundamentals", externalUrl: "https://angular.dev/overview" },
      { key: "testing", title: "Testing en Angular", externalUrl: "https://angular.dev/guide/testing" },
      {
        key: "a11y",
        title: "Accesibilidad web (a11y)",
        externalUrl: "https://developer.mozilla.org/en-US/docs/Web/Accessibility",
      },
      {
        key: "demo-link",
        title: "Recurso del catálogo (demo enlace)",
        description: "Nodo de ejemplo enlazado a un recurso existente del catálogo, para probar el render de nodos vinculados.",
        learningResourceId: DEMO_RESOURCE_IDS[4],
      },
    ],
    edges: [
      ["html", "css"],
      ["html", "js"],
      ["js", "dom"],
      ["js", "ts"],
      ["git", "angular"],
      ["dom", "angular"],
      ["ts", "angular"],
      ["css", "a11y"],
      ["angular", "testing"],
    ],
  },
  {
    title: "TypeScript desde los fundamentos",
    description:
      "Curso de TypeScript en progreso — de tipos básicos a los patrones que se usan todos los días en EAP-Ecosystem.",
    mode: "sequential",
    nodes: [
      {
        key: "basic-types",
        title: "Tipos básicos",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/2/basic-types.html",
        order: 1,
      },
      {
        key: "everyday-types",
        title: "Everyday Types",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
        order: 2,
      },
      {
        key: "narrowing",
        title: "Narrowing",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
        order: 3,
      },
      {
        key: "functions",
        title: "Funciones",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/2/functions.html",
        order: 4,
      },
      {
        key: "object-types",
        title: "Object Types",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/2/objects.html",
        order: 5,
      },
      {
        key: "generics",
        title: "Generics",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
        order: 6,
      },
      {
        key: "classes",
        title: "Classes",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/2/classes.html",
        order: 7,
      },
      {
        key: "utility-types",
        title: "Utility Types",
        externalUrl: "https://www.typescriptlang.org/docs/handbook/utility-types.html",
        order: 8,
      },
      {
        key: "demo-link",
        title: "Recurso del catálogo (demo enlace)",
        description: "Nodo de ejemplo enlazado a un recurso existente del catálogo, para probar el render de nodos vinculados.",
        learningResourceId: DEMO_RESOURCE_IDS[0],
        order: 9,
      },
      {
        key: "practice",
        title: "Practicar con ejercicios",
        externalUrl: "https://typescript-exercises.github.io/",
        order: 10,
      },
    ],
  },
  {
    title: "Fundamentos de Estructuras de Datos y Algoritmos",
    description:
      "Mapa amplio de DSA para reforzar Fundamentos — nodos con las dependencias principales; ir afinando subtemas y agregando ejercicios propios.",
    mode: "graph",
    nodes: [
      { key: "big-o", title: "Notación Big O", externalUrl: "https://www.bigocheatsheet.com/" },
      {
        key: "arrays",
        title: "Arrays",
        externalUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections",
      },
      {
        key: "strings",
        title: "Strings",
        externalUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Text_formatting",
      },
      { key: "recursion", title: "Recursión", externalUrl: "https://developer.mozilla.org/en-US/docs/Glossary/Recursion" },
      {
        key: "linked-lists",
        title: "Linked Lists",
        externalUrl: "https://www.freecodecamp.org/news/implementing-a-linked-list-in-javascript/",
      },
      {
        key: "stacks-queues",
        title: "Stacks & Queues",
        externalUrl: "https://www.freecodecamp.org/news/stacks-and-queues-in-javascript-with-examples/",
      },
      {
        key: "hashing",
        title: "Hashing / Hash Tables",
        externalUrl: "https://www.freecodecamp.org/news/hash-tables/",
      },
      {
        key: "trees",
        title: "Trees (Binary Trees / BST)",
        externalUrl: "https://www.freecodecamp.org/news/all-you-need-to-know-about-tree-data-structures-bceacb85490c/",
      },
      {
        key: "graphs",
        title: "Graphs",
        externalUrl: "https://www.freecodecamp.org/news/graph-data-structure-with-javascript/",
      },
      {
        key: "sorting",
        title: "Algoritmos de sorting",
        externalUrl: "https://www.freecodecamp.org/news/sorting-algorithms-explained/",
      },
      {
        key: "searching",
        title: "Búsqueda binaria",
        externalUrl: "https://www.freecodecamp.org/news/binary-search-algorithm/",
      },
      {
        key: "dp",
        title: "Dynamic Programming",
        externalUrl:
          "https://www.freecodecamp.org/news/follow-these-steps-to-solve-any-dynamic-programming-interview-problem/",
      },
      {
        key: "demo-link",
        title: "Recurso del catálogo (demo enlace)",
        description: "Nodo de ejemplo enlazado a un recurso existente del catálogo, para probar el render de nodos vinculados.",
        learningResourceId: DEMO_RESOURCE_IDS[1],
      },
    ],
    edges: [
      ["big-o", "arrays"],
      ["big-o", "recursion"],
      ["arrays", "strings"],
      ["arrays", "hashing"],
      ["arrays", "sorting"],
      ["sorting", "searching"],
      ["recursion", "linked-lists"],
      ["recursion", "trees"],
      ["recursion", "dp"],
      ["linked-lists", "stacks-queues"],
      ["trees", "graphs"],
      ["hashing", "dp"],
    ],
  },
  {
    title: "Docker — de cero a contenedores en producción",
    description:
      "Curso de Docker planeado — arranca por conceptos y cierra con buenas prácticas para imágenes que se vayan a deployar.",
    mode: "sequential",
    nodes: [
      { key: "what-is-docker", title: "¿Qué es Docker?", externalUrl: "https://docs.docker.com/get-started/overview/", order: 1 },
      { key: "get-started", title: "Instalación y primeros pasos", externalUrl: "https://docs.docker.com/get-started/", order: 2 },
      {
        key: "dockerfile",
        title: "Dockerfile — referencia",
        externalUrl: "https://docs.docker.com/engine/reference/builder/",
        order: 3,
      },
      { key: "compose", title: "Docker Compose", externalUrl: "https://docs.docker.com/compose/", order: 4 },
      { key: "volumes", title: "Volúmenes", externalUrl: "https://docs.docker.com/storage/volumes/", order: 5 },
      { key: "networking", title: "Networking", externalUrl: "https://docs.docker.com/network/", order: 6 },
      {
        key: "multi-stage",
        title: "Multi-stage builds",
        externalUrl: "https://docs.docker.com/build/building/multi-stage/",
        order: 7,
      },
      {
        key: "best-practices",
        title: "Buenas prácticas",
        externalUrl: "https://docs.docker.com/develop/dev-best-practices/",
        order: 8,
      },
      {
        key: "demo-link",
        title: "Recurso del catálogo (demo enlace)",
        description: "Nodo de ejemplo enlazado a un recurso existente del catálogo, para probar el render de nodos vinculados.",
        learningResourceId: DEMO_RESOURCE_IDS[2],
        order: 9,
      },
    ],
  },
  {
    title: "CLIs de agentes: Claude Code y opencode",
    description:
      "Videos planeados sobre CLIs de coding agents — primero Claude Code a fondo, después comparar con opencode.",
    mode: "sequential",
    nodes: [
      {
        key: "cc-overview",
        title: "Claude Code — overview",
        externalUrl: "https://docs.claude.com/en/docs/claude-code/overview",
        order: 1,
      },
      {
        key: "cc-quickstart",
        title: "Claude Code — quickstart",
        externalUrl: "https://docs.claude.com/en/docs/claude-code/quickstart",
        order: 2,
      },
      {
        key: "cc-cli-reference",
        title: "Claude Code — CLI reference",
        externalUrl: "https://docs.claude.com/en/docs/claude-code/cli-reference",
        order: 3,
      },
      {
        key: "agent-sdk",
        title: "Claude Agent SDK",
        description: "Pendiente: confirmar el link exacto a la doc del Agent SDK antes de estudiarlo.",
        order: 4,
      },
      {
        key: "opencode",
        title: "opencode CLI",
        description: "Pendiente: verificar la URL exacta de la documentación en opencode.ai antes de estudiarlo.",
        order: 5,
      },
      {
        key: "demo-link",
        title: "Recurso del catálogo (demo enlace)",
        description: "Nodo de ejemplo enlazado a un recurso existente del catálogo, para probar el render de nodos vinculados.",
        learningResourceId: DEMO_RESOURCE_IDS[3],
        order: 6,
      },
    ],
  },
];

try {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const pathRepo = AppDataSource.getRepository(LearningPathEntity);
  const nodeRepo = AppDataSource.getRepository(LearningPathNodeEntity);
  const edgeRepo = AppDataSource.getRepository(LearningPathEdgeEntity);

  const [user] = await userRepo.find({ take: 1 });
  if (!user) throw new Error("No user found — seed a user before seeding learning paths.");

  let pathCount = 0;
  let nodeCount = 0;
  let edgeCount = 0;

  for (const pathDef of paths) {
    const pathEntity = new LearningPathEntity();
    pathEntity.id = pathDef.id ?? randomUUID();
    pathEntity.userId = user.id;
    pathEntity.title = pathDef.title;
    pathEntity.description = pathDef.description;
    pathEntity.mode = pathDef.mode;
    pathEntity.source = "manual";
    pathEntity.sourceSlug = null;
    await pathRepo.save(pathEntity);
    pathCount += 1;

    const keyToId = new Map<string, string>();
    const nodeEntities = pathDef.nodes.map((nodeDef) => {
      const id = randomUUID();
      keyToId.set(nodeDef.key, id);

      const entity = new LearningPathNodeEntity();
      entity.id = id;
      entity.pathId = pathEntity.id;
      entity.title = nodeDef.title;
      entity.description = nodeDef.description ?? null;
      entity.externalUrl = nodeDef.externalUrl ?? null;
      entity.learningResourceId = nodeDef.learningResourceId ?? null;
      entity.stubScope = nodeDef.learningResourceId ? null : "path-local";
      entity.order = nodeDef.order ?? null;
      entity.progress = "pending";
      return entity;
    });
    await nodeRepo.save(nodeEntities);
    nodeCount += nodeEntities.length;

    if (pathDef.edges?.length) {
      const edgeEntities = pathDef.edges.map(([sourceKey, targetKey]) => {
        const entity = new LearningPathEdgeEntity();
        entity.id = randomUUID();
        entity.pathId = pathEntity.id;
        entity.sourceNodeId = keyToId.get(sourceKey)!;
        entity.targetNodeId = keyToId.get(targetKey)!;
        return entity;
      });
      await edgeRepo.save(edgeEntities);
      edgeCount += edgeEntities.length;
    }

    console.log(`✅ ${pathDef.title} (${pathDef.mode}) — ${nodeEntities.length} nodos, ${pathDef.edges?.length ?? 0} edges`);
  }

  console.log(`\n✅ Seeded ${pathCount} learning paths, ${nodeCount} nodes, ${edgeCount} edges`);

  await AppDataSource.destroy();
} catch (error) {
  console.error("❌ Seed failed:", error);
  process.exit(1);
}
