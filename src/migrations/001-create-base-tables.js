async function up(query) {
  // UNITS (Unidades da empresa)
  await query(`
    CREATE TABLE IF NOT EXISTS units (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ Tabela units criada');

  // USERS (Usuários do sistema)
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      pin_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'comercial', 'assistencial', 'familiar')),
      unit_id UUID REFERENCES units(id),
      phone VARCHAR(20),
      job_title VARCHAR(100),
      active BOOLEAN DEFAULT true,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ Tabela users criada');

  // RESIDENTS (Residentes)
  await query(`
    CREATE TABLE IF NOT EXISTS residents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id UUID NOT NULL REFERENCES units(id),
      full_name VARCHAR(255) NOT NULL,
      birth_date DATE NOT NULL,
      room VARCHAR(50),
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discharged')),
      created_by_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ Tabela residents criada');
}

module.exports = { up };
