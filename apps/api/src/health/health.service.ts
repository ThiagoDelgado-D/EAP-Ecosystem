import { Injectable } from "@nestjs/common";
import { healthCheck } from "@learning-resource/domain";

@Injectable()
export class HealthService {
  getHealth() {
    return healthCheck();
  }
}
