import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  LearningResourceEntity,
  TopicEntity,
  ResourceTypeEntity,
} from "@learning-resource/infrastructure";
import {
  IdentityEntity,
  SessionEntity,
  SignInChallengeEntity,
  UserEntity,
} from "@user/infrastructure";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: "postgres",
          host: configService.getOrThrow<string>("DB_HOST"),
          port: parseInt(configService.getOrThrow<string>("DB_PORT"), 10),
          username: configService.getOrThrow<string>("DB_USER"),
          password: configService.getOrThrow<string>("DB_PASSWORD"),
          database: configService.getOrThrow<string>("DB_NAME"),
          entities: [
            LearningResourceEntity,
            TopicEntity,
            ResourceTypeEntity,
            UserEntity,
            IdentityEntity,
            SignInChallengeEntity,
            SessionEntity,
          ],
          synchronize: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
