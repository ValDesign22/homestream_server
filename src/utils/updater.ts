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

      // await extract({
      //   file: 'update.tar.gz',
      //   cwd: __dirname,
      // });

      // console.log('Update extracted. Restarting server...');

      // // exec('pm2 restart all', (error, stdout, stderr) => {

      // // });
    });
  } catch (error) {
    console.error('Failed to download update:', error);
  }
};

const checkForUpdates = async () => {
  try {
    const response = await axios.get('https://api.github.com/repos/username/repo/releases/latest');
    const latestVersion = response.data.tag_name;

    if (latestVersion !== `v${version}`) {
      console.log(`Update available: ${latestVersion}. Downloading update...`);

      const downloadUrl = response.data.assets.find((asset: any) => asset.name === `update-${latestVersion}.tar.gz`).browser_download_url;
      await downloadAndApplyUpdate(downloadUrl);
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
};

export { checkForUpdates };