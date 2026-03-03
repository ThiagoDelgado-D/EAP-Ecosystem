import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service.js";

import "reflect-metadata";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.getHealth();
  }
}
