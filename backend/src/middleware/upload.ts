import multer from 'multer';
import path from 'path';
import { uploadPaths } from '../config';
import { generateId } from '../utils/id';

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadPaths.raw);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '') || '.bin';
    callback(null, `${Date.now()}-${generateId('upload')}${extension}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const allowed =
    file.mimetype.startsWith('video/') ||
    file.mimetype.startsWith('image/') ||
    file.fieldname === 'video' ||
    file.fieldname === 'thumbnail' ||
    file.fieldname === 'image';

  if (!allowed) {
    callback(new Error('Unsupported file type.'));
    return;
  }

  callback(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
});
