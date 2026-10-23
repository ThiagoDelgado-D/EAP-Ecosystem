import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionRotationTracking1780200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions
        ADD COLUMN IF NOT EXISTS "rotatedAt" TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS "replacedBySessionId" UUID NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions
        DROP COLUMN IF EXISTS "replacedBySessionId",
        DROP COLUMN IF EXISTS "rotatedAt"
    `);
  }
}
