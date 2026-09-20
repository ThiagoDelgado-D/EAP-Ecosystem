import { IsInt, IsPositive } from "class-validator";

export class ExtendSessionDto {
  @IsInt()
  @IsPositive()
  minutes!: number;
}
