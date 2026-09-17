import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionAutoCompleted1779500000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pomodoro_sessions
      ADD COLUMN "autoCompleted" BOOLEAN NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pomodoro_sessions
      DROP COLUMN IF EXISTS "autoCompleted"
    `);
  }
}
