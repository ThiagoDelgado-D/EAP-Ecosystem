import { IsArray, IsIn } from "class-validator";
import { WidgetKey } from "@user/domain";

export class UpdateWidgetConfigDto {
  @IsArray()
  @IsIn(Object.values(WidgetKey), { each: true })
  widgetConfig: string[];
}
