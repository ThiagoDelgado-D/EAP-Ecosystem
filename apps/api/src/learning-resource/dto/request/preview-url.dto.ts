import { IsNotEmpty, IsUrl } from "class-validator";
import { Expose } from "class-transformer";

export class PreviewUrlDto {
  @Expose()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  url: string;
}
