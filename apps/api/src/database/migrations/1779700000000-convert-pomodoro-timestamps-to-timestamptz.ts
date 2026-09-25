import type { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertPomodoroTimestampsToTimestamptz1779700000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pomodoro_sessions
        ALTER COLUMN "startedAt" TYPE TIMESTAMPTZ USING "startedAt" AT TIME ZONE 'UTC',
        ALTER COLUMN "completedAt" TYPE TIMESTAMPTZ USING "completedAt" AT TIME ZONE 'UTC'
    `);

    await queryRunner.query(`
      ALTER TABLE pomodoro_breaks
        ALTER COLUMN "startedAt" TYPE TIMESTAMPTZ USING "startedAt" AT TIME ZONE 'UTC',
        ALTER COLUMN "endedAt" TYPE TIMESTAMPTZ USING "endedAt" AT TIME ZONE 'UTC'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pomodoro_breaks
        ALTER COLUMN "startedAt" TYPE TIMESTAMP USING "startedAt" AT TIME ZONE 'UTC',
        ALTER COLUMN "endedAt" TYPE TIMESTAMP USING "endedAt" AT TIME ZONE 'UTC'
    `);

    await queryRunner.query(`
      ALTER TABLE pomodoro_sessions
        ALTER COLUMN "startedAt" TYPE TIMESTAMP USING "startedAt" AT TIME ZONE 'UTC',
        ALTER COLUMN "completedAt" TYPE TIMESTAMP USING "completedAt" AT TIME ZONE 'UTC'
    `);
  }
}
