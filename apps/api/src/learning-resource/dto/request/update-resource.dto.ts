import {
  IsString,
  IsUrl,
  IsUUID,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @ValidateIf((o) => o.url !== "")
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsUUID()
  typeId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  topicIds?: string[];

  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
