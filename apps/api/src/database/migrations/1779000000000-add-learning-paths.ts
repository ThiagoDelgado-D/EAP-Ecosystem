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
      CREATE INDEX idx_learning_paths_user_id ON learning_paths ("userId")
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
        CONSTRAINT pk_learning_path_nodes PRIMARY KEY (id),
        CONSTRAINT uq_learning_path_nodes_path UNIQUE ("pathId", id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_path_nodes_path_id ON learning_path_nodes ("pathId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_path_nodes_resource_id ON learning_path_nodes ("learningResourceId")
    `);

    await queryRunner.query(`
      CREATE TABLE learning_path_edges (
        id             UUID NOT NULL,
        "pathId"       UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
        "sourceNodeId" UUID NOT NULL,
        "targetNodeId" UUID NOT NULL,
        CONSTRAINT pk_learning_path_edges PRIMARY KEY (id),
        CONSTRAINT uq_learning_path_edges UNIQUE ("pathId", "sourceNodeId", "targetNodeId"),
        CONSTRAINT fk_edge_source FOREIGN KEY ("pathId", "sourceNodeId")
          REFERENCES learning_path_nodes ("pathId", id) ON DELETE CASCADE,
        CONSTRAINT fk_edge_target FOREIGN KEY ("pathId", "targetNodeId")
          REFERENCES learning_path_nodes ("pathId", id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_path_edges_path_id ON learning_path_edges ("pathId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_path_edges_source_node ON learning_path_edges ("sourceNodeId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_path_edges_target_node ON learning_path_edges ("targetNodeId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS learning_path_edges`);
    await queryRunner.query(`DROP TABLE IF EXISTS learning_path_nodes`);
    await queryRunner.query(`DROP TABLE IF EXISTS learning_paths`);
  }
}
