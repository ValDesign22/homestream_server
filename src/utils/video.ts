import { exec } from 'node:child_process';

export function getHardwareAccelerationSupport(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec('ffmpeg -hwaccels', (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) return reject(stderr);

      const hwaccels = stdout
        .split('\n')
        .slice(1)
        .map((hwaccel) => hwaccel.trim())
        .filter((hwaccel) => hwaccel.length > 0);

      resolve(hwaccels);
    });
  });
}