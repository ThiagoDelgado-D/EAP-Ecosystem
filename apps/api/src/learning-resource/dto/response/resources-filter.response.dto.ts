import { ResourceResponseDto } from "./resource-response.dto.js";

export class ResourcesFilterResponseDto {
  resources: ResourceResponseDto[];
  total: number;
}
