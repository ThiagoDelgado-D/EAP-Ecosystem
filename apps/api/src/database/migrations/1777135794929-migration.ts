import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777135794929 implements MigrationInterface {
  name = "Migration1777135794929";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "topics" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "color" character varying(7) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_types" ("id" uuid NOT NULL, "code" character varying(50) NOT NULL, "displayName" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d3bca389a6c56e445c7487b245e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "learning_resources" ("id" uuid NOT NULL, "title" character varying(500) NOT NULL, "url" character varying(2048), "imageUrl" character varying(2048), "notes" text, "difficulty" character varying(20) NOT NULL, "energyLevel" character varying(20) NOT NULL, "status" character varying(20) NOT NULL, "mentalState" character varying(20), "estimatedDurationMinutes" integer, "isDurationEstimated" boolean NOT NULL DEFAULT true, "lastViewedAt" TIMESTAMP, "resourceTypeId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1012bb5224f1a3f663f08de41fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "userName" character varying, "enabled" boolean NOT NULL DEFAULT true, "featureConfig" text array NOT NULL DEFAULT '{}', "widgetConfig" text array NOT NULL DEFAULT '{}', "bio" text, "avatar" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "identities" ("id" uuid NOT NULL, "userId" uuid NOT NULL, "provider" character varying(20) NOT NULL, "providerSubject" character varying NOT NULL, "verified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2727c12d844e87c607930d91211" UNIQUE ("provider", "providerSubject"), CONSTRAINT "PK_7b2f8cccf4ac6a2d7e6e9e8b1f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3144d31adb77f8fdd5aecf28f4" ON "identities" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sign_in_challenges" ("id" uuid NOT NULL, "email" character varying NOT NULL, "codeHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "consumed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f57d5bce65af0940271d12af92d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76ddae9cfaeb4840a3aa52fca9" ON "sign_in_challenges" ("email", "consumed") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL, "userId" uuid NOT NULL, "refreshTokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "userAgent" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b08788ca45cbd90f0bd96c2f077" UNIQUE ("refreshTokenHash"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions" ("userId") `,
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
      `ALTER TABLE "identities" ADD CONSTRAINT "FK_3144d31adb77f8fdd5aecf28f4a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "identities" DROP CONSTRAINT "FK_3144d31adb77f8fdd5aecf28f4a"`,
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
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57de40bc620f456c7311aa3a1e"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_76ddae9cfaeb4840a3aa52fca9"`,
    );
    await queryRunner.query(`DROP TABLE "sign_in_challenges"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3144d31adb77f8fdd5aecf28f4"`,
    );
    await queryRunner.query(`DROP TABLE "identities"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "learning_resources"`);
    await queryRunner.query(`DROP TABLE "resource_types"`);
    await queryRunner.query(`DROP TABLE "topics"`);
  }
}
