import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import {
  LearningResourceEntity,
  ResourceTypeEntity,
  TopicEntity,
} from "@learning-resource/infrastructure";
import {
  UserEntity,
  IdentityEntity,
  SignInChallengeEntity,
  SessionEntity,
} from "@user/infrastructure";

config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    LearningResourceEntity,
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
