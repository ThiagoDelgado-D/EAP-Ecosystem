import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateLearningPathDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
