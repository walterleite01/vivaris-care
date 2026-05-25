async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS daily_activities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID REFERENCES residents(id), activity_type VARCHAR(100), activity_date DATE, activity_time TIME, description TEXT, status VARCHAR(50) DEFAULT 'completed', notes TEXT, photo_url VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ daily_activities');
}
module.exports = { up };
