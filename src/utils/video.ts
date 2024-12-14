import { exec } from 'node:child_process';
import ffmpeg, { Codec } from 'fluent-ffmpeg';

export function getHardwareAccelerationSupport(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec('ffmpeg -hwaccels', (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) return reject(stderr);

      console.log(stdout);

      const hwaccels = stdout
        .split('\n')
        .slice(1)
        .map((hwaccel) => hwaccel.trim())
        .filter((hwaccel) => hwaccel.length > 0);

      console.log(hwaccels);

      resolve(hwaccels);
    });
  });
}

export function getCodecs(): Promise<Codec[]> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableCodecs((err, codecs) => {
      if (err) return reject(err);

      const codecsList = [];

      for (const codec in codecs) {
        if (codecs[codec].type === 'video' && codecs[codec].canDecode) codecsList.push(codecs[codec]);
      }

      resolve(codecsList);
    });
  });
}