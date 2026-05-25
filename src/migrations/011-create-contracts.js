async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS contracts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID UNIQUE REFERENCES residents(id), contract_number VARCHAR(50) UNIQUE, start_date DATE, end_date DATE, contract_status VARCHAR(50) DEFAULT 'active', monthly_fee DECIMAL(10,2), payment_method VARCHAR(50), responsible_name VARCHAR(255), health_plan VARCHAR(100), contract_pdf_url VARCHAR(500), signed BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await query(`CREATE TABLE IF NOT EXISTS contract_amendments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contract_id UUID REFERENCES contracts(id), amendment_date DATE, amendment_type VARCHAR(100), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ contracts');
}
module.exports = { up };
