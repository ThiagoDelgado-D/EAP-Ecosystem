import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import {
  LearningResourceEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningPathEdgeEntity,
  ResourceRelationEntity,
  ResourceTypeEntity,
  TopicEntity,
} from "@learning-resource/infrastructure";
import {
  UserEntity,
  IdentityEntity,
  SignInChallengeEntity,
  SessionEntity,
} from "@user/infrastructure";

config({ path: "../../apps/api/.env" });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    LearningResourceEntity,
    LearningPathEntity,
    LearningPathNodeEntity,
    LearningPathEdgeEntity,
    ResourceRelationEntity,
    ResourceTypeEntity,
    TopicEntity,
    UserEntity,
    IdentityEntity,
    SignInChallengeEntity,
    SessionEntity,
  ],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
});
