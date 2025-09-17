// Set required env vars for Jest tests
process.env.APP_QB_URL = 'http://localhost:8080';
process.env.APP_QB_CATEGORY = 'books';
process.env.APP_QB_USERNAME = 'admin';
process.env.APP_QB_PASSWORD = 'adminadmin';
process.env.MAM_TOKEN_FILE = 'secrets/mam_api_token';
process.env.APP_MAM_USER_AGENT = 'Scurry/1.0 (+contact)';
process.env.APP_PASSWORD = 'cheese';

// Suppress console output during tests
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();
