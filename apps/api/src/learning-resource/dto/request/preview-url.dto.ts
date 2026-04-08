import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class PreviewUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  url: string;
}
