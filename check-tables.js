const pool = require('./src/db');

(async () => {
  try {
    const result = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND (tablename LIKE 'timeline%' OR tablename LIKE 'family%')
      ORDER BY tablename;
    `);
    
    console.log('\n✅ TABELAS CRIADAS:');
    result.rows.forEach(row => {
      console.log(`   📊 ${row.tablename}`);
    });
    
    if (result.rows.length === 5) {
      console.log('\n✅ TODAS AS 5 TABELAS CRIADAS COM SUCESSO!\n');
    } else {
      console.log(`\n⚠️  Esperava 5 tabelas, encontrou ${result.rows.length}\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
