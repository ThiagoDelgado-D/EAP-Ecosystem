import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1773441266350 implements MigrationInterface {
  name = "Migration1773441266350";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "topics" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "color" character varying(7) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_types" ("id" uuid NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d3bca389a6c56e445c7487b245e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "learning_resources" ("id" uuid NOT NULL, "title" character varying(500) NOT NULL, "url" character varying(2048), "notes" text, "difficulty" character varying(20) NOT NULL, "energyLevel" character varying(20) NOT NULL, "status" character varying(20) NOT NULL, "estimatedDurationMinutes" integer, "isDurationEstimated" boolean NOT NULL DEFAULT true, "lastViewedAt" TIMESTAMP, "resourceTypeId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1012bb5224f1a3f663f08de41fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "learning_resource_topics" ("learningResourceId" uuid NOT NULL, "topicId" uuid NOT NULL, CONSTRAINT "PK_94f50c9196c2c914f19a0b3bab7" PRIMARY KEY ("learningResourceId", "topicId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01b182afc0b78e428f7bf18b8c" ON "learning_resource_topics" ("learningResourceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a342e407826030d2c9292b09c4" ON "learning_resource_topics" ("topicId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" ADD CONSTRAINT "FK_6bd06e6ef6b3d3d75e4c7318c6e" FOREIGN KEY ("resourceTypeId") REFERENCES "resource_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resource_topics" ADD CONSTRAINT "FK_01b182afc0b78e428f7bf18b8cc" FOREIGN KEY ("learningResourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resource_topics" ADD CONSTRAINT "FK_a342e407826030d2c9292b09c4b" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "learning_resource_topics" DROP CONSTRAINT "FK_a342e407826030d2c9292b09c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resource_topics" DROP CONSTRAINT "FK_01b182afc0b78e428f7bf18b8cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_resources" DROP CONSTRAINT "FK_6bd06e6ef6b3d3d75e4c7318c6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a342e407826030d2c9292b09c4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_01b182afc0b78e428f7bf18b8c"`,
    );
    await queryRunner.query(`DROP TABLE "learning_resource_topics"`);
    await queryRunner.query(`DROP TABLE "learning_resources"`);
    await queryRunner.query(`DROP TABLE "resource_types"`);
    await queryRunner.query(`DROP TABLE "topics"`);
  }
}
