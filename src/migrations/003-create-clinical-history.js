async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS clinical_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID REFERENCES residents(id), diagnosis_name VARCHAR(255), icd10_code VARCHAR(20), diagnosis_date DATE, status VARCHAR(50) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ clinical_history');
}
module.exports = { up };
