async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS timeline_moments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE, posted_by UUID NOT NULL REFERENCES users(id), moment_type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, description TEXT, media_url VARCHAR(500), media_type VARCHAR(20), audience VARCHAR(50) NOT NULL DEFAULT 'family_visible', approved BOOLEAN DEFAULT false, approved_by UUID REFERENCES users(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_moment_resident ON timeline_moments(resident_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_moment_posted ON timeline_moments(posted_by)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_moment_created ON timeline_moments(created_at DESC)`);
  console.log('  ✓ timeline_moments');
}
module.exports = { up };
