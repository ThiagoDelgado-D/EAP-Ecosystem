import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPomodoroBreaks1779400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE pomodoro_breaks (
        id            UUID          NOT NULL,
        "userId"      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "startedAt"   TIMESTAMP     NOT NULL,
        "durationSec" INT           NOT NULL,
        "endedAt"     TIMESTAMP,
        CONSTRAINT pk_pomodoro_breaks PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_pomodoro_breaks_user_id ON pomodoro_breaks ("userId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS pomodoro_breaks`);
  }
}
