import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { defaultAttractions } from '../data/defaultData.js';
import { query } from '../db.js';

export function toPublicCard(activity) {
  return {
    id: activity.id ?? null,
    name: activity.name || '',
    category: activity.category || '',
    ride_type: activity.ride_type || `${activity.category || ''} Ride`,
    zone: activity.zone || 'Wonderland',
    wait: Number(activity.wait ?? activity.wait_minutes ?? 0),
    capacity: Number(activity.capacity ?? activity.hourly_capacity ?? 0),
    status: activity.status || activity.operating_status || 'Operational',
    tagline: activity.tagline || '',
    icon: activity.icon || 'mdi-star-circle',
    color: activity.color || '#ee3e50',
    details: [
      activity.duration_label || 'All day',
      activity.requirement_label || 'All Ages',
    ],
    background_image: activity.background_image || 'assets/images/wonderland-hero.png',
    image_position: activity.image_position || 'center',
    is_visible: Number(activity.is_visible ?? 1),
  };
}

export async function allActivities() {
  await seedActivities();
  return query(
    `SELECT id, category, ride_type, name, tagline, duration_label, requirement_label,
            background_image, image_position, icon, color, zone, wait_minutes AS wait,
            hourly_capacity AS capacity, operating_status AS status, is_visible, created_at, updated_at
     FROM activities_tb
     ORDER BY id ASC`,
  );
}

export async function visibleActivities() {
  return (await allActivities()).filter((activity) => Number(activity.is_visible ?? 1) === 1);
}

export async function createActivity(requestBody, file) {
  const backgroundImage = await resolveBackgroundImage(requestBody, file);
  const activity = {
    category: String(requestBody.category || '').trim(),
    ride_type: String(requestBody.ride_type || '').trim(),
    name: String(requestBody.name || '').trim(),
    tagline: String(requestBody.tagline || '').trim(),
    duration_label: String(requestBody.duration_label || '').trim(),
    requirement_label: String(requestBody.requirement_label || '').trim(),
    background_image: backgroundImage,
    icon: String(requestBody.icon || 'mdi-star-circle').trim(),
    color: String(requestBody.color || '#ee3e50').trim(),
    zone: String(requestBody.zone || 'Wonderland').trim(),
    wait: Number(requestBody.wait || 0),
    capacity: Number(requestBody.capacity || 0),
    status: String(requestBody.status || 'Operational').trim(),
    is_visible: requestBody.is_visible ? 1 : 0,
    created_at: new Date().toISOString(),
  };

  if (!activity.category || !activity.ride_type || !activity.name || !activity.tagline) {
    return false;
  }

  await query(
    `INSERT INTO activities_tb (
      category, ride_type, name, tagline, duration_label, requirement_label,
      background_image, icon, color, zone, wait_minutes, hourly_capacity,
      operating_status, is_visible
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activity.category,
      activity.ride_type,
      activity.name,
      activity.tagline,
      activity.duration_label,
      activity.requirement_label,
      activity.background_image,
      activity.icon,
      activity.color,
      activity.zone,
      activity.wait,
      activity.capacity,
      activity.status,
      activity.is_visible,
    ],
  );
  return true;
}

export async function setActivityVisibility(id, isVisible) {
  const result = await query(
    'UPDATE activities_tb SET is_visible = ? WHERE id = ?',
    [isVisible ? 1 : 0, id],
  );
  return result.affectedRows > 0;
}

async function resolveBackgroundImage(body, file) {
  if (!file) {
    return body.background_image_path || 'assets/images/wonderland-hero.png';
  }

  await fs.mkdir(config.activityImageDir, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase();
  const fileName = `activity-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}${extension}`;
  const targetPath = path.join(config.activityImageDir, fileName);
  await fs.rename(file.path, targetPath);
  return `assets/images/activities/${fileName}`;
}

async function seedActivities() {
  const rows = await query('SELECT COUNT(*) AS total FROM activities_tb');
  if (Number(rows[0]?.total || 0) > 0) {
    return;
  }

  await Promise.all(defaultAttractions.map((activity) => query(
    `INSERT INTO activities_tb (
      category, ride_type, name, tagline, duration_label, requirement_label,
      background_image, image_position, icon, color, zone, wait_minutes,
      hourly_capacity, operating_status, is_visible
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activity.category,
      activity.ride_type,
      activity.name,
      activity.tagline,
      activity.duration_label,
      activity.requirement_label,
      activity.background_image,
      activity.image_position,
      activity.icon,
      activity.color,
      activity.zone,
      activity.wait,
      activity.capacity,
      activity.status,
      activity.is_visible,
    ],
  )));
}
