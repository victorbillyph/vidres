import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export async function compressVideo(inputPath: string, outputPath: string): Promise<void> {
  if (!ffmpegPath) {
    throw new Error('FFmpeg binary is not available.');
  }

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf',
        'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '28',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
      ])
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .save(outputPath);
  });
}
