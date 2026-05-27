async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS timeline_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE, author_id UUID NOT NULL REFERENCES users(id), author_type VARCHAR(50) NOT NULL, event_type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, content TEXT NOT NULL, audience VARCHAR(50) NOT NULL DEFAULT 'internal_only', is_critical BOOLEAN DEFAULT false, tags TEXT[], created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_timeline_resident ON timeline_events(resident_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_timeline_author ON timeline_events(author_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_timeline_created ON timeline_events(created_at DESC)`);
  console.log('  ✓ timeline_events');
}
module.exports = { up };
