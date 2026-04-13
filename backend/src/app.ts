import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error';

const app = express();

app.use(
  cors({
    origin: [config.frontendOrigin, 'http://127.0.0.1:5173'],
    credentials: true,
  }),
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(config.rootDir, 'uploads')));
app.use('/api', apiRoutes);
app.use(errorHandler);

export default app;
