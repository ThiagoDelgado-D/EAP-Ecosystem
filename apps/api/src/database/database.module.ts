import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import EncryptedSqlite from "better-sqlite3-multiple-ciphers";
import {
  LearningResourceEntity,
  TopicEntity,
  ResourceTypeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningPathEdgeEntity,
  ResourceRelationEntity,
} from "@learning-resource/infrastructure";
import {
  IdentityEntity,
  SessionEntity,
  SignInChallengeEntity,
  UserEntity,
} from "@user/infrastructure";
import {
  PomodoroSessionEntity,
  SegmentEntity as PomodoroSegmentEntity,
  BreakEntity as PomodoroBreakEntity,
} from "@pomodoro/infrastructure";
import { RecommendationContextEntity } from "@recommendation/infrastructure";

const entities = [
  LearningResourceEntity,
  TopicEntity,
  ResourceTypeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningPathEdgeEntity,
  ResourceRelationEntity,
  UserEntity,
  IdentityEntity,
  SignInChallengeEntity,
  SessionEntity,
  PomodoroSessionEntity,
  PomodoroSegmentEntity,
  PomodoroBreakEntity,
  RecommendationContextEntity,
];

const unicodeLower = (value: unknown) =>
  value === null ? null : String(value).toLowerCase();

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        if (configService.get<string>("DB_TYPE") === "sqlite") {
          return {
            type: "better-sqlite3",
            driver: EncryptedSqlite,
            database: configService.getOrThrow<string>("DB_PATH"),
            key: configService.getOrThrow<string>("DB_KEY"),
            prepareDatabase: (db: EncryptedSqlite.Database) => {
              db.function("lower", { deterministic: true }, unicodeLower);
            },
            enableWAL: true,
            entities,
            synchronize: true,
          };
        }

        return {
          type: "postgres",
          host: configService.getOrThrow<string>("DB_HOST"),
          port: parseInt(configService.getOrThrow<string>("DB_PORT"), 10),
          username: configService.getOrThrow<string>("DB_USER"),
          password: configService.getOrThrow<string>("DB_PASSWORD"),
          database: configService.getOrThrow<string>("DB_NAME"),
          entities,
          synchronize: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
