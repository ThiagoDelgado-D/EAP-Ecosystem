import type { UUID } from "domain-lib";

declare module "express" {
  interface Request {
    userId?: UUID;
  }
}
