import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPomodoroSessions1779300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE pomodoro_sessions (
        id            UUID          NOT NULL,
        "userId"      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "startedAt"   TIMESTAMP     NOT NULL,
        "completedAt" TIMESTAMP,
        intent        VARCHAR(500),
        "plannedMin"  INT           NOT NULL,
        CONSTRAINT pk_pomodoro_sessions PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_pomodoro_sessions_user_id ON pomodoro_sessions ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE pomodoro_segments (
        id                   UUID         NOT NULL,
        "sessionId"          UUID         NOT NULL REFERENCES pomodoro_sessions(id) ON DELETE CASCADE,
        "startSec"           INT          NOT NULL,
        "endSec"             INT,
        "targetKind"         VARCHAR(20)  NOT NULL,
        "resourceId"         UUID         REFERENCES learning_resources(id) ON DELETE SET NULL,
        "learningPathId"     UUID         REFERENCES learning_paths(id) ON DELETE SET NULL,
        "learningPathNodeId" UUID         REFERENCES learning_path_nodes(id) ON DELETE SET NULL,
        CONSTRAINT pk_pomodoro_segments PRIMARY KEY (id),
        CONSTRAINT chk_pomodoro_segments_target_kind CHECK ("targetKind" IN ('free', 'resource', 'node'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_pomodoro_segments_session_id ON pomodoro_segments ("sessionId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS pomodoro_segments`);
    await queryRunner.query(`DROP TABLE IF EXISTS pomodoro_sessions`);
  }
}
