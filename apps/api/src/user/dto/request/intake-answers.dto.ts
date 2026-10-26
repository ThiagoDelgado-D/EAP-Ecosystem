import { ArrayMinSize, ArrayUnique, IsArray, IsIn } from "class-validator";
import { IntakeGoal, StudyStyle } from "@user/domain";

export class IntakeAnswersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(Object.values(IntakeGoal), { each: true })
  goals!: IntakeGoal[];

  @IsIn(Object.values(StudyStyle))
  studyStyle!: StudyStyle;
}
