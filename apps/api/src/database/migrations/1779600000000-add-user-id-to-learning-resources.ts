import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToLearningResources1779600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE learning_resources ADD COLUMN "userId" UUID
    `);

    // Pre-beta: every existing row belongs to the single account that's used this
    // instance so far, so backfilling to the earliest-created user is safe here.
    await queryRunner.query(`
      UPDATE learning_resources
      SET "userId" = (SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1)
      WHERE "userId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE learning_resources
        ALTER COLUMN "userId" SET NOT NULL,
        ADD CONSTRAINT fk_learning_resources_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_resources_user_id ON learning_resources ("userId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_learning_resources_user_id`);
    await queryRunner.query(`ALTER TABLE learning_resources DROP CONSTRAINT IF EXISTS fk_learning_resources_user`);
    await queryRunner.query(`ALTER TABLE learning_resources DROP COLUMN IF EXISTS "userId"`);
  }
}
