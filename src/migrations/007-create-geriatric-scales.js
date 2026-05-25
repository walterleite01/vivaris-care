async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS geriatric_scales (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID UNIQUE REFERENCES residents(id), morse_score INTEGER, morse_level VARCHAR(50), braden_score INTEGER, braden_level VARCHAR(50), katz_score INTEGER, katz_level VARCHAR(50), evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ geriatric_scales');
}
module.exports = { up };
