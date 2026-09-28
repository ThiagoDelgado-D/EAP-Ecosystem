import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecommendationContexts1779800000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE recommendation_contexts (
        "userId"          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "energyLevel"     VARCHAR(20)   NOT NULL,
        "availableMinutes" INT,
        "mentalState"     VARCHAR(20),
        "updatedAt"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT pk_recommendation_contexts PRIMARY KEY ("userId")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS recommendation_contexts`);
  }
}
