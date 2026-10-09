import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { TopicTone } from "@learning-resource/domain";

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(TopicTone)
  color?: TopicTone;
}
