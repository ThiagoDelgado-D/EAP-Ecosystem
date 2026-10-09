import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserWeeklyGoalMinutes1780000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "weeklyGoalMinutes" INTEGER NOT NULL DEFAULT 600
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS "weeklyGoalMinutes"
    `);
  }
}
