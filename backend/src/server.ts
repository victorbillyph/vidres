import app from './app';
import { config } from './config';
import { ensureStorage } from './services/dbService';

async function start() {
  await ensureStorage();

  app.listen(config.port, () => {
    console.log(`Vidres backend running on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start the backend.', error);
  process.exit(1);
});

