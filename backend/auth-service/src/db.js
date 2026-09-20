import mysql from 'mysql2/promise';
import { config } from './config.js';

let pool;
let ready;

export async function query(sql, params = []) {
  await ensureDatabase();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function ensureDatabase() {
  if (ready) {
    return ready;
  }

  ready = (async () => {
    const connection = await mysql.createConnection({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      multipleStatements: true,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.dbName}\``);
    await connection.end();

    pool = mysql.createPool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      waitForConnections: true,
      connectionLimit: 10,
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitors_tb (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL UNIQUE,
        contact_number VARCHAR(30) NULL,
        password_hash VARCHAR(255) NOT NULL,
        status TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_visitors_tb_email (email),
        INDEX idx_visitors_tb_status (status)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS administrators_tb (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_name VARCHAR(60) NOT NULL DEFAULT 'Administrator',
        status TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_administrators_tb_email (email),
        INDEX idx_administrators_tb_status (status)
      )
    `);
  })();

  return ready;
}
