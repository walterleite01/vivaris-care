async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS allergies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID REFERENCES residents(id), substance VARCHAR(255), type VARCHAR(50), severity VARCHAR(50), reaction_description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ allergies');
}
module.exports = { up };
