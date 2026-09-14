import { IsInt, IsPositive } from "class-validator";

export class ExtendBreakDto {
  @IsInt()
  @IsPositive()
  seconds!: number;
}
