async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS vaccination (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID REFERENCES residents(id), vaccine_name VARCHAR(255), application_date DATE, batch_number VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('  ✓ vaccination');
}
module.exports = { up };
