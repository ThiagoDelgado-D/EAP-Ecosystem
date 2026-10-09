import type { MigrationInterface, QueryRunner } from "typeorm";

const TONE_HEX: Record<string, string> = {
  pine: "#2c6a51",
  ochre: "#94640d",
  ember: "#b8502c",
  info: "#3a5a80",
  plum: "#7c4a68",
  slate: "#6a6a63",
};

const FALLBACK_TONE = "slate";

const toRgb = (hex: string): [number, number, number] | null => {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
};

const closestTone = (hex: string): string => {
  const rgb = toRgb(hex);
  if (!rgb) return FALLBACK_TONE;
  let closest = FALLBACK_TONE;
  let smallestDistance = Number.POSITIVE_INFINITY;
  for (const [tone, toneHex] of Object.entries(TONE_HEX)) {
    const toneRgb = toRgb(toneHex)!;
    const distance =
      (rgb[0] - toneRgb[0]) ** 2 + (rgb[1] - toneRgb[1]) ** 2 + (rgb[2] - toneRgb[2]) ** 2;
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closest = tone;
    }
  }
  return closest;
};

export class TopicsOwnedByEachLearner1779900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE topics ADD COLUMN "userId" UUID`);

    const sharedTopics: { topicId: string }[] = await queryRunner.query(`
      SELECT lrt."topicId"
      FROM learning_resource_topics lrt
      JOIN learning_resources lr ON lr.id = lrt."learningResourceId"
      GROUP BY lrt."topicId"
      HAVING COUNT(DISTINCT lr."userId") > 1
    `);
    if (sharedTopics.length > 0) {
      throw new Error(
        `Topics used by more than one learner can't be assigned a single owner: ${sharedTopics
          .map((row) => row.topicId)
          .join(", ")}`,
      );
    }

    await queryRunner.query(`
      UPDATE topics t
      SET "userId" = owner."userId"
      FROM (
        SELECT DISTINCT lrt."topicId", lr."userId"
        FROM learning_resource_topics lrt
        JOIN learning_resources lr ON lr.id = lrt."learningResourceId"
      ) owner
      WHERE owner."topicId" = t.id
    `);

    await queryRunner.query(`DELETE FROM topics WHERE "userId" IS NULL`);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, FIRST_VALUE(id) OVER (
          PARTITION BY "userId", LOWER(name) ORDER BY "createdAt", id
        ) AS "keptId"
        FROM topics
      )
      INSERT INTO learning_resource_topics ("learningResourceId", "topicId")
      SELECT lrt."learningResourceId", ranked."keptId"
      FROM learning_resource_topics lrt
      JOIN ranked ON ranked.id = lrt."topicId"
      WHERE ranked.id <> ranked."keptId"
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, FIRST_VALUE(id) OVER (
          PARTITION BY "userId", LOWER(name) ORDER BY "createdAt", id
        ) AS "keptId"
        FROM topics
      )
      DELETE FROM topics USING ranked
      WHERE topics.id = ranked.id AND ranked.id <> ranked."keptId"
    `);

    await queryRunner.query(`ALTER TABLE topics ALTER COLUMN color TYPE VARCHAR(20)`);
    const colors: { id: string; color: string }[] = await queryRunner.query(
      `SELECT id, color FROM topics`,
    );
    for (const { id, color } of colors) {
      await queryRunner.query(`UPDATE topics SET color = $1 WHERE id = $2`, [
        closestTone(color),
        id,
      ]);
    }

    await queryRunner.query(`
      ALTER TABLE topics
        ALTER COLUMN "userId" SET NOT NULL,
        ADD CONSTRAINT fk_topics_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_topics_user_lower_name ON topics ("userId", LOWER(name))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_topics_user_lower_name`);
    await queryRunner.query(`ALTER TABLE topics DROP CONSTRAINT IF EXISTS fk_topics_user`);
    await queryRunner.query(`ALTER TABLE topics DROP COLUMN IF EXISTS "userId"`);
  }
}
