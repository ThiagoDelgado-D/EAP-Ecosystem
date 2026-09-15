import type { UUID } from "domain-lib";
import type { Break } from "../entities/break.js";

export interface IBreakRepository {
  save(activeBreak: Break): Promise<Break>;
  update(activeBreak: Break): Promise<Break>;
  findById(breakId: UUID): Promise<Break | null>;
  findActiveByUserId(userId: UUID): Promise<Break | null>;
  findByUserIdBetween(userId: UUID, since: Date, until?: Date): Promise<Break[]>;
}
