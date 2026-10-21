import { describe, expect, test } from "vitest";
import type { CapabilityKey } from "./capability.js";
import { CAPABILITY_CATALOG } from "./capability-catalog.js";
import { MODULE_CATALOG } from "./module.js";

const EVERY_CAPABILITY: ReadonlySet<CapabilityKey> = new Set(
  CAPABILITY_CATALOG.map((definition) => definition.key),
);

describe("CAPABILITY_CATALOG", () => {
  test("Should hold every module as a root capability", () => {
    for (const module of MODULE_CATALOG) {
      const definition = CAPABILITY_CATALOG.find(({ key }) => key === module.key);

      expect(definition).toBeDefined();
      expect(definition!.parent).toBeUndefined();
    }
  });

  test("Should only name parents and requirements that are in the catalog", () => {
    for (const definition of CAPABILITY_CATALOG) {
      const referenced = definition.parent
        ? [definition.parent, ...definition.requires]
        : definition.requires;

      for (const key of referenced) {
        expect(EVERY_CAPABILITY.has(key)).toBe(true);
      }
    }
  });

  test("Should prefix every child's key with its parent's key", () => {
    for (const definition of CAPABILITY_CATALOG) {
      if (!definition.parent) continue;

      expect(definition.key.startsWith(`${definition.parent}.`)).toBe(true);
    }
  });
});
