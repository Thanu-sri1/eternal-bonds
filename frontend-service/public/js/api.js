let cachedConfig = null;

async function getAppConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  try {
    const response = await fetch('/config');
    if (!response.ok) {
      throw new Error('Could not fetch app configuration.');
    }
    cachedConfig = await response.json();
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load configuration. Defaulting to localhost ports:', error);
    cachedConfig = {
      userServiceUrl: 'http://localhost:5001',
      matchServiceUrl: 'http://localhost:5002',
      connectionServiceUrl: 'http://localhost:5003'
    };
    return cachedConfig;
  }
}
