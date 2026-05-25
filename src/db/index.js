const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool:', err);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executada (${duration}ms)`);
    return res;
  } catch (err) {
    console.error('❌ Erro na query:', err.message);
    throw err;
  }
}

async function initializeDatabase() {
  try {
    const res = await query('SELECT NOW()');
    console.log('✅ Banco de dados online');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar banco:', err.message);
    console.log('⚠️ Continuando sem banco (será necessário para próximos passos)');
    return false;
  }
}

module.exports = { pool, query, initializeDatabase };
