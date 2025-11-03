import type { UUID } from "../types/uuid.js";

export interface Person {
  firstName: string;
  lastName: string;

  email: string;
  bio?: string | null;
  avatar?: UUID | null;
}
