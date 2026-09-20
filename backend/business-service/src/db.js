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
      CREATE TABLE IF NOT EXISTS ticket_passes_tb (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ticket_tier VARCHAR(120) NOT NULL,
        guests VARCHAR(120) NOT NULL,
        ticket_price_indicative DECIMAL(10,2) NOT NULL,
        effective_price_per_guest DECIMAL(10,2) NOT NULL,
        status TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ticket_passes_tier (ticket_tier),
        INDEX idx_ticket_passes_status (status)
      )
    `);

    await removeDuplicateTicketPasses();
    await ensureUniqueIndex(
      'ticket_passes_tb',
      'uniq_ticket_passes_tier',
      'CREATE UNIQUE INDEX uniq_ticket_passes_tier ON ticket_passes_tb (ticket_tier)',
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities_tb (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(60) NOT NULL,
        ride_type VARCHAR(80) NOT NULL,
        name VARCHAR(140) NOT NULL,
        tagline TEXT NOT NULL,
        duration_label VARCHAR(40) NULL,
        requirement_label VARCHAR(80) NULL,
        background_image VARCHAR(255) NOT NULL DEFAULT 'assets/images/wonderland-hero.png',
        image_position VARCHAR(80) NULL,
        icon VARCHAR(80) NOT NULL DEFAULT 'mdi-star-circle',
        color VARCHAR(20) NOT NULL DEFAULT '#ee3e50',
        zone VARCHAR(100) NULL,
        wait_minutes INT UNSIGNED NOT NULL DEFAULT 0,
        hourly_capacity INT UNSIGNED NOT NULL DEFAULT 0,
        operating_status VARCHAR(60) NOT NULL DEFAULT 'Operational',
        is_visible TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_activities_tb_category (category),
        INDEX idx_activities_tb_visible (is_visible)
      )
    `);

    await ensureColumn(
      'activities_tb',
      'image_position',
      "ALTER TABLE activities_tb ADD COLUMN image_position VARCHAR(80) NULL AFTER background_image",
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_bookings_tb (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        visitor_name VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL,
        visit_date DATE NOT NULL,
        ticket_type VARCHAR(40) NOT NULL,
        ticket_label VARCHAR(120) NOT NULL,
        quantity INT UNSIGNED NOT NULL DEFAULT 1,
        contact_number VARCHAR(30) NULL,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        booking_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ticket_bookings_tb_email (email),
        INDEX idx_ticket_bookings_tb_visit_date (visit_date)
      )
    `);
  })();

  return ready;
}

async function ensureColumn(tableName, columnName, alterSql) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [config.dbName, tableName, columnName],
  );

  if (Number(rows[0]?.total || 0) === 0) {
    await pool.query(alterSql);
  }
}

async function ensureUniqueIndex(tableName, indexName, createSql) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [config.dbName, tableName, indexName],
  );

  if (Number(rows[0]?.total || 0) === 0) {
    await pool.query(createSql);
  }
}

async function removeDuplicateTicketPasses() {
  await pool.query(`
    DELETE duplicate_pass
    FROM ticket_passes_tb duplicate_pass
    INNER JOIN ticket_passes_tb original_pass
      ON duplicate_pass.ticket_tier = original_pass.ticket_tier
      AND duplicate_pass.id > original_pass.id
  `);
}
