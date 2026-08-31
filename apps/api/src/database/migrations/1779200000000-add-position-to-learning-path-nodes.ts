import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPositionToLearningPathNodes1779200000000 implements MigrationInterface {
  name = "AddPositionToLearningPathNodes1779200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "learning_path_nodes" ADD COLUMN IF NOT EXISTS "x" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_nodes" ADD COLUMN IF NOT EXISTS "y" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "learning_path_nodes" DROP COLUMN IF EXISTS "y"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_nodes" DROP COLUMN IF EXISTS "x"`,
    );
  }
}
