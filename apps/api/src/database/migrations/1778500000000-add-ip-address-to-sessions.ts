import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddIpAddressToSessions1778500000000 implements MigrationInterface {
  name = "AddIpAddressToSessions1778500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "ipAddress" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN IF EXISTS "ipAddress"`,
    );
  }
}
