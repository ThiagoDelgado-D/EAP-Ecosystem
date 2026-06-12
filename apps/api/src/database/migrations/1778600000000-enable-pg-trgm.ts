import type { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePgTrgm1778600000000 implements MigrationInterface {
  name = "EnablePgTrgm1778600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_lr_title_trgm
       ON learning_resources USING gin (lower(title) gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_lr_title_trgm`);
  }
}
