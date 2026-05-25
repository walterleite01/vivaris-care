async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS medications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID REFERENCES residents(id), medication_name VARCHAR(255), dose DECIMAL(10,2), dose_unit VARCHAR(50), frequency VARCHAR(100), route VARCHAR(50), start_date DATE, active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ medications');
}
module.exports = { up };
