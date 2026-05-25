async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS resident_identification (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID NOT NULL UNIQUE REFERENCES residents(id), full_name VARCHAR(255), cpf VARCHAR(20) UNIQUE, gender VARCHAR(20), birth_date DATE, phone VARCHAR(20), email VARCHAR(255), address VARCHAR(500), city VARCHAR(100), state VARCHAR(2), responsible_name VARCHAR(255), responsible_phone VARCHAR(20), health_plan VARCHAR(100), monthly_cost DECIMAL(10,2), blood_type VARCHAR(10), allergies_description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ resident_identification');
}
module.exports = { up };
