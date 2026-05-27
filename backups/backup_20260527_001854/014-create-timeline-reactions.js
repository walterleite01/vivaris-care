async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS timeline_reactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE, comment_id UUID REFERENCES timeline_comments(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id), reaction VARCHAR(20) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reaction_event ON timeline_reactions(event_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reaction_comment ON timeline_reactions(comment_id)`);
  console.log('  ✓ timeline_reactions');
}
module.exports = { up };
