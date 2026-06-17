import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAppearancePreferences1778700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS language     VARCHAR(10)  NOT NULL DEFAULT 'en',
        ADD COLUMN IF NOT EXISTS timezone     VARCHAR(50)  NOT NULL DEFAULT 'UTC',
        ADD COLUMN IF NOT EXISTS "startOfWeek" VARCHAR(10) NOT NULL DEFAULT 'monday',
        ADD COLUMN IF NOT EXISTS "reduceMotion" BOOLEAN    NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "compactMode"  BOOLEAN    NOT NULL DEFAULT FALSE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS language,
        DROP COLUMN IF EXISTS timezone,
        DROP COLUMN IF EXISTS "startOfWeek",
        DROP COLUMN IF EXISTS "reduceMotion",
        DROP COLUMN IF EXISTS "compactMode"
    `);
  }
}
