import { IsArray, IsDefined, IsIn, IsInt, Max, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OPTIONAL_MODULES, WEEKLY_GOAL_MINUTES_RANGE, type ModuleKey } from "@user/domain";
import { IntakeAnswersDto } from "./intake-answers.dto.js";

export class ApplyIntakeDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => IntakeAnswersDto)
  intake!: IntakeAnswersDto;

  @IsArray()
  @IsIn(OPTIONAL_MODULES, { each: true })
  enabledModules!: ModuleKey[];

  @IsInt()
  @Min(WEEKLY_GOAL_MINUTES_RANGE.MIN)
  @Max(WEEKLY_GOAL_MINUTES_RANGE.MAX)
  weeklyGoalMinutes!: number;
}
