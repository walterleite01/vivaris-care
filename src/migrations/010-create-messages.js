async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID REFERENCES residents(id), sender_id UUID REFERENCES users(id), message_text TEXT, message_type VARCHAR(50) DEFAULT 'text', attachment_url VARCHAR(500), emoji VARCHAR(10), is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await query(`CREATE TABLE IF NOT EXISTS message_recipients (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), message_id UUID REFERENCES messages(id), recipient_id UUID REFERENCES users(id), is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ messages');
}
module.exports = { up };
