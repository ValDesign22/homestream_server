import axios from 'axios';
import { updaterUrl, version } from '../../package.json';
import { createWriteStream } from 'fs';
import { extract } from 'tar';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

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

const checkForUpdates = async (): Promise<{ updateAvailable: boolean, latestVersion: string, downloadUrl?: string }> => {
  try {
    const response = await axios.get(updaterUrl);
    const latestVersion = response.data.tag_name.slice(1);

    if (compareVersion(version, latestVersion)) {
      const asset = response.data.assets.find((asset: any) => asset.name === `update.tar.gz`);
      return { updateAvailable: true, latestVersion, downloadUrl: asset.browser_download_url };
    } else return { updateAvailable: false, latestVersion };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { updateAvailable: false, latestVersion: version };
  }
};

export { checkForUpdates, downloadAndApplyUpdate };