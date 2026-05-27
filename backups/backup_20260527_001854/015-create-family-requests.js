async function up(query) {
  await query(`CREATE TABLE IF NOT EXISTS family_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE, family_id UUID NOT NULL REFERENCES users(id), request_type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, status VARCHAR(50) NOT NULL DEFAULT 'open', priority VARCHAR(20) NOT NULL DEFAULT 'medium', assigned_to UUID REFERENCES users(id), assigned_department VARCHAR(50), response TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, resolved_at TIMESTAMP, response_deadline TIMESTAMP)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_request_resident ON family_requests(resident_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_request_family ON family_requests(family_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_request_assigned ON family_requests(assigned_to)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_request_status ON family_requests(status)`);
  console.log('  ✓ family_requests');
}
module.exports = { up };
