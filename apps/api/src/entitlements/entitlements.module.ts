import { Module } from "@nestjs/common";
import { ImplicitPlanEntitlementsProvider } from "@user/infrastructure";

@Module({
  providers: [
    { provide: "IEntitlementsProvider", useClass: ImplicitPlanEntitlementsProvider },
  ],
  exports: ["IEntitlementsProvider"],
})
export class EntitlementsModule {}
