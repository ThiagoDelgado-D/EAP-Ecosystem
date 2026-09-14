import type { UUID } from "domain-lib";
import type { Break } from "../entities/break.js";

export interface IBreakRepository {
  save(activeBreak: Break): Promise<Break>;
  findActiveByUserId(userId: UUID): Promise<Break | null>;
}
