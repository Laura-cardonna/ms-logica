import 'dotenv/config';
import 'reflect-metadata';
import { readFileSync } from 'fs';
import { register } from 'tsconfig-paths';
import { DataSource } from 'typeorm';

register({
  baseUrl: './',
  paths: {},
});

const dataSource = new DataSource({
  type: 'mysql',
  connectorPackage: 'mysql2',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl:
    process.env.DB_SSL === 'true'
      ? { ca: readFileSync(process.env.DB_CA_PATH as string), rejectUnauthorized: true }
      : undefined,
  entities: ['src/**/*.entity{.ts,.js}', 'dist/**/*.entity.js'],
  migrations: ['src/migrations/*{.ts,.js}', 'dist/migrations/*.js'],
  synchronize: true,
});

export default dataSource;
