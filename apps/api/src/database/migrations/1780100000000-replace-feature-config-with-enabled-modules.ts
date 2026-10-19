import type { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceFeatureConfigWithEnabledModules1780100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users RENAME COLUMN "featureConfig" TO "enabledModules"
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ALTER COLUMN "enabledModules" SET DEFAULT '{learning-paths,pomodoro,recommendation}'
    `);
    await queryRunner.query(`
      UPDATE users SET "enabledModules" = '{learning-paths,pomodoro,recommendation}'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users SET "enabledModules" = array_remove("enabledModules", 'recommendation')
    `);
    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN "enabledModules" SET DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE users RENAME COLUMN "enabledModules" TO "featureConfig"
    `);
  }
}
