import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service.js";

import "reflect-metadata";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {
    console.log("HealthController constructor, service:", healthService);
  }

  @Get()
  check() {
    console.log(this.healthService.getHealth());

    return this.healthService.getHealth();
  }
}
