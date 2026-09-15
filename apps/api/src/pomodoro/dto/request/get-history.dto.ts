import { IsISO8601, IsOptional } from "class-validator";

export class GetHistoryDto {
  @IsISO8601()
  since!: string;

  @IsOptional()
  @IsISO8601()
  until?: string;
}
