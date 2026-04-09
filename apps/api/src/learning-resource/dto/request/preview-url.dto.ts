import { IsString, IsUrl } from "class-validator";
import { Transform } from "class-transformer";

export class PreviewUrlDto {
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  url: string;
}
