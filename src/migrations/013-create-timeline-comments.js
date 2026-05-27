async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS timeline_comments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE, author_id UUID NOT NULL REFERENCES users(id), author_type VARCHAR(50) NOT NULL, content TEXT NOT NULL, visibility VARCHAR(50) NOT NULL DEFAULT 'internal_only', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_comment_event ON timeline_comments(event_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_comment_author ON timeline_comments(author_id)`);
  console.log('  ✓ timeline_comments');
}
module.exports = { up };
