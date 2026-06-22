import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddResourceRelations1779100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE resource_relations (
        id                   UUID         NOT NULL,
        "userId"             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "sourceResourceId"   UUID         NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
        "targetResourceId"   UUID         NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
        type                 VARCHAR(20)  NOT NULL,
        "createdAt"          TIMESTAMP    NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT pk_resource_relations PRIMARY KEY (id),
        CONSTRAINT uq_resource_relations UNIQUE ("userId", "sourceResourceId", "targetResourceId", type),
        CONSTRAINT chk_resource_relations_no_self CHECK ("sourceResourceId" <> "targetResourceId")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS resource_relations`);
  }
}
