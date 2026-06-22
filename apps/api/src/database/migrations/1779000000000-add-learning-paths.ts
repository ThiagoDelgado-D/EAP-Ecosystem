import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddLearningPaths1779000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE learning_paths (
        id            UUID          NOT NULL,
        "userId"      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title         VARCHAR(500)  NOT NULL,
        description   TEXT,
        mode          VARCHAR(20)   NOT NULL,
        source        VARCHAR(20)   NOT NULL DEFAULT 'manual',
        "sourceSlug"  VARCHAR(200),
        "createdAt"   TIMESTAMP     NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT pk_learning_paths PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE learning_path_nodes (
        id                   UUID          NOT NULL,
        "pathId"             UUID          NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
        title                VARCHAR(500)  NOT NULL,
        description          TEXT,
        "externalUrl"        VARCHAR(2048),
        "learningResourceId" UUID          REFERENCES learning_resources(id) ON DELETE SET NULL,
        "stubScope"          VARCHAR(20),
        "order"              INT,
        progress             VARCHAR(20)   NOT NULL DEFAULT 'pending',
        "createdAt"          TIMESTAMP     NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT pk_learning_path_nodes PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE learning_path_edges (
        id             UUID NOT NULL,
        "pathId"       UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
        "sourceNodeId" UUID NOT NULL REFERENCES learning_path_nodes(id) ON DELETE CASCADE,
        "targetNodeId" UUID NOT NULL REFERENCES learning_path_nodes(id) ON DELETE CASCADE,
        CONSTRAINT pk_learning_path_edges PRIMARY KEY (id),
        CONSTRAINT uq_learning_path_edges UNIQUE ("pathId", "sourceNodeId", "targetNodeId")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS learning_path_edges`);
    await queryRunner.query(`DROP TABLE IF EXISTS learning_path_nodes`);
    await queryRunner.query(`DROP TABLE IF EXISTS learning_paths`);
  }
}
