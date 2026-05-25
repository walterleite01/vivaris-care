const fs = require('fs');
const path = require('path');
const { query } = require('./index');

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migrations...');
    
    // Criar tabela de controle de migrations
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ler arquivos de migration
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();
    
    for (const file of files) {
      const migrationName = file.replace('.js', '');
      
      // Verificar se já foi executada
      const result = await query(
        'SELECT * FROM migrations WHERE name = $1',
        [migrationName]
      );
      
      if (result.rows.length === 0) {
        console.log(`▶️  Executando: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        await migration.up(query);
        
        // Registrar no controle
        await query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationName]
        );
        
        console.log(`✅ ${file} executada com sucesso!`);
      } else {
        console.log(`⏭️  ${file} já foi executada (pulando)`);
      }
    }
    
    console.log('🎉 Todas as migrations foram executadas!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao executar migrations:', err.message);
    throw err;
  }
}

module.exports = { runMigrations };
