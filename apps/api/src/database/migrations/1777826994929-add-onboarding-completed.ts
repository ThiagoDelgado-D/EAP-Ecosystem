import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnboardingCompleted1777826994929 implements MigrationInterface {
  name = "AddOnboardingCompleted1777826994929";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "onboardingCompleted"`,
    );
  }
}
