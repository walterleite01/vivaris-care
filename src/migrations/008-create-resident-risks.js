async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS resident_risks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID UNIQUE REFERENCES residents(id), fall_risk_level VARCHAR(50), pressure_ulcer_risk_level VARCHAR(50), dehydration_risk_level VARCHAR(50), malnutrition_risk_level VARCHAR(50), inappropriate_medication_risk BOOLEAN, infection_risk_level VARCHAR(50), last_assessment_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ resident_risks');
}
module.exports = { up };
