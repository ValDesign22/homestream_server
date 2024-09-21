import axios from 'axios';
import { createWriteStream } from 'node:fs';
import { extract } from 'tar';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';

const updaterUrl = 'https://api.github.com/repos/ValDesign22/homestream_server/releases/latest';
const version = '1.1.7';

const exec = promisify(execCallback);

const downloadFile = (url: string, destination: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const writer = createWriteStream(destination);
    axios.get(url, { responseType: 'stream' })
      .then(response => response.data.pipe(writer))
      .catch(reject);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

const compareVersion = (current: string, latest: string): boolean => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (currentPart < latestPart) return true;
    if (currentPart > latestPart) return false;
  }

  return false;
}

const downloadAndApplyUpdate = async (downloadUrl: string) => {
  try {
    console.log('Downloading update...');
    await downloadFile(downloadUrl, 'update.tar.gz');
    console.log('Update downloaded. Extracting...');

    await extract({
      file: 'update.tar.gz',
      cwd: process.cwd(),
    });

    console.log('Update extracted. Installing dependencies...');

    await exec(`cd ${process.cwd()} && npm install`);
    console.log('Dependencies installed. Restarting server...');

    await exec('pm2 restart all');
    console.log('Server restarted.');
    console.log('Update applied.');
  } catch (error) {
    console.error('Failed to download update:', error);
  }
};

const checkForUpdates = async (): Promise<{ updateAvailable: boolean, latestVersion: string, version?: string, downloadUrl?: string }> => {
  try {
    const response = await axios.get(updaterUrl);
    const latestVersion = response.data.tag_name.slice(1);

    if (compareVersion(version, latestVersion)) {
      const asset = response.data.assets.find((asset: any) => asset.name === `update.tar.gz`);
      if (!asset) return { updateAvailable: false, latestVersion: version };
      return { updateAvailable: true, version, latestVersion, downloadUrl: asset.browser_download_url };
    } else return { updateAvailable: false, latestVersion: version };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { updateAvailable: false, latestVersion: version };
  }
};

export { checkForUpdates, downloadAndApplyUpdate };