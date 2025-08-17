import { initializeDatabases, getConfig, getDatabase } from './src/lib/database.js';

async function checkConfig() {
  try {
    await initializeDatabases();
    
    console.log('Checking configuration values:');
    const mamToken = await getConfig('mam_token');
    const hardcoverToken = await getConfig('hardcover_token');
    const hardcoverUserId = await getConfig('hardcover_user_id');
    
    console.log('MAM Token exists:', !!mamToken);
    console.log('Hardcover Token exists:', !!hardcoverToken);
    console.log('Hardcover User ID exists:', !!hardcoverUserId);
    console.log('Hardcover User ID value:', hardcoverUserId);
    
    // List all documents in config database
    const db = getDatabase('scurry_config');
    const result = await db.list({ include_docs: true });
    console.log('\nAll config documents:');
    result.rows.forEach(row => {
      console.log(`- ${row.id}: ${JSON.stringify(row.doc.value)}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkConfig();
