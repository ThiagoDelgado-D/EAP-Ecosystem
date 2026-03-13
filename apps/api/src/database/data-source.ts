import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";

config({ path: "../../.env" });
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ["src/database/entities/*.entity.ts"],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
});
