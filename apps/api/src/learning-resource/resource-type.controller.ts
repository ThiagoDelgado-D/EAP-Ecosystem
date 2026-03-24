import { Controller, Get, Inject } from "@nestjs/common";
import type { IResourceTypeRepository } from "@learning-resource/domain";
import { getResourceTypes } from "@learning-resource/application";

@Controller("api/v1/resource-types")
export class ResourceTypeController {
  constructor(
    @Inject("IResourceTypeRepository")
    private readonly resourceTypeRepository: IResourceTypeRepository,
  ) {}

  @Get()
  async list() {
    return await getResourceTypes({
      resourceTypeRepository: this.resourceTypeRepository,
    });
  }
}
