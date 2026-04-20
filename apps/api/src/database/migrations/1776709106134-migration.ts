import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776709106134 implements MigrationInterface {
  name = "Migration1776709106134";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "userName" character varying, "enabled" boolean NOT NULL DEFAULT true, "featureConfig" text array NOT NULL DEFAULT '{}', "widgetConfig" text array NOT NULL DEFAULT '{}', "bio" text, "avatar" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "identities" ("id" uuid NOT NULL, "userId" uuid NOT NULL, "provider" character varying(20) NOT NULL, "providerSubject" character varying NOT NULL, "verified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2727c12d844e87c607930d91211" UNIQUE ("provider", "providerSubject"), CONSTRAINT "PK_7b2f8cccf4ac6a2d7e6e9e8b1f6" PRIMARY KEY ("id"))`,
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
      `CREATE INDEX "IDX_b08788ca45cbd90f0bd96c2f07" ON "sessions" ("refreshTokenHash") `,
    );
    await queryRunner.query(
      `ALTER TABLE "identities" ADD CONSTRAINT "FK_3144d31adb77f8fdd5aecf28f4a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "identities" DROP CONSTRAINT "FK_3144d31adb77f8fdd5aecf28f4a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b08788ca45cbd90f0bd96c2f07"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_76ddae9cfaeb4840a3aa52fca9"`,
    );
    await queryRunner.query(`DROP TABLE "sign_in_challenges"`);
    await queryRunner.query(`DROP TABLE "identities"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
