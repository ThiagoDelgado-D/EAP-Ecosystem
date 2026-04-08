import { IsUrl } from "class-validator";

export class PreviewUrlDto {
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  url: string;
}
