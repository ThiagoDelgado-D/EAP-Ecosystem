import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774968984426 implements MigrationInterface {
  name = "Migration1774968984426";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "learning_resources" ADD "imageUrl" character varying(2048)`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" ADD "mentalState" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "learning_resources" DROP COLUMN "mentalState"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" DROP COLUMN "imageUrl"`,
    );
  }
}
