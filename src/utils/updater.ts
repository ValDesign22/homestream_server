import axios from 'axios';
import { updaterUrl, version } from '../../package.json';
import { createWriteStream } from 'fs';
import { extract } from 'tar';
import { exec } from 'child_process';

const downloadAndApplyUpdate = async (downloadUrl: string) => {
  try {
    const writer = createWriteStream('update.tar.gz');
    const response = await axios.get(downloadUrl, { responseType: 'stream' });
    response.data.pipe(writer);

    writer.on('finish', async () => {
      console.log('Update downloaded. Extracting...');

      await extract({
        file: 'update.tar.gz',
        cwd: process.cwd(),
      });

      console.log('Update extracted. Installing dependencies...');

      exec(`cd ${process.cwd()} && npm install`, (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to install dependencies:', error);
          return;
        }

        console.log('Dependencies installed. Restarting server...');

        exec('pm2 restart all', (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to restart server:', error);
            return;
          }

          console.log('Server restarted.');
        });
      });

      console.log('Update applied.');
    });
  } catch (error) {
    console.error('Failed to download update:', error);
  }
};

const checkForUpdates = async (): Promise<boolean | void> => {
  try {
    const response = await axios.get(updaterUrl);
    const latestVersion = response.data.tag_name;

    if (latestVersion !== `v${version}`) {
      console.log(`Update available: ${latestVersion}. Downloading update...`);

      const asset = response.data.assets.find((asset: any) => asset.name === `update.tar.gz`);
      if (asset) await downloadAndApplyUpdate(asset.browser_download_url);
      return true;
    } else return false;
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
};

export { checkForUpdates };