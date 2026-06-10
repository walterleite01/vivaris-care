async function up(query) {
  // Colunas que o controller de messages espera mas não existiam no schema original
  await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await query(`ALTER TABLE message_recipients ADD COLUMN IF NOT EXISTS read_at TIMESTAMP`);

  // Coluna que a rota de medications usa mas não existia (bug!)
  await query(`ALTER TABLE medications ADD COLUMN IF NOT EXISTS prescribed_by_id UUID REFERENCES users(id)`);

  // Backfill: mensagens antigas recebem sent_at = created_at
  await query(`UPDATE messages SET sent_at = created_at WHERE sent_at IS NULL`);

  // Índices para performance do chat
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_resident ON messages(resident_id, sent_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_msg_recipients_unread ON message_recipients(recipient_id) WHERE read_at IS NULL`);

  console.log('  ✓ chat schema fix (sent_at, read_at, índices)');
}
module.exports = { up };
