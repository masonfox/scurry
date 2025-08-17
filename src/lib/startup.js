// Startup initialization for the app
import "server-only";
import { startBookDownloadCron, isCronRunning } from './cronJobs';
import { initializeDatabases } from './database';

let initialized = false;
let initializing = false;
let initializationPromise = null;

export async function initializeApp() {
  // If already initialized, return immediately
  if (initialized) {
    return;
  }

  // If currently initializing, return the existing promise
  if (initializing && initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializing = true;
  initializationPromise = performInitialization();
  
  try {
    await initializationPromise;
  } finally {
    initializing = false;
    initializationPromise = null;
  }
}

async function performInitialization() {
  try {
    console.log('Initializing Scurry application...');
    
    // Initialize databases
    await initializeDatabases();
    console.log('✅ Databases initialized');

    // Start cron job (if enabled)
    const cronEnabled = process.env.ENABLE_CRON === 'true';
    console.log(`Cron job enabled: ${cronEnabled}`);
    
    if (cronEnabled) {
      if (!isCronRunning()) {
        startBookDownloadCron();
        console.log('✅ Cron job started');
      }
    } else {
      console.log('⏸️ Cron job disabled via ENABLE_CRON environment variable');
    }

    initialized = true;
    console.log('🎉 Scurry application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    initialized = false; // Reset on failure
    throw error;
  }
}

// Auto-initialize on server-side import
if (typeof window === 'undefined') {
  initializeApp().catch(console.error);
}
