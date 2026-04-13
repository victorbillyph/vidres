import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'vidres-local-secret',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  tokenName: 'vidres_token',
  tokenMaxAgeMs: 1000 * 60 * 60 * 24 * 7,
  rootDir,
  dataDir: path.join(rootDir, 'data'),
  uploadDir: path.join(rootDir, 'uploads'),
};

export const uploadPaths = {
  raw: path.join(config.uploadDir, 'raw'),
  videos: path.join(config.uploadDir, 'videos'),
  thumbnails: path.join(config.uploadDir, 'thumbnails'),
  channels: path.join(config.uploadDir, 'channels'),
};


