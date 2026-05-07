import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { runSeeds } from './index';

const AppDataSource = new DataSource({
  type: 'mysql',
  connectorPackage: 'mysql2',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity{.ts,.js}', 'dist/**/*.entity.js'],
  migrations: ['src/migrations/*{.ts,.js}', 'dist/migrations/*.js'],
  synchronize: false,
});

async function main() {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // Run the seeds
    await runSeeds(AppDataSource);

    // Close the connection
    await AppDataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Seed runner error:', error);
    process.exit(1);
  }
}

main();
