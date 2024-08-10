import 'dotenv/config';

import express from 'express';

import { configHandler } from './routes/config.patch';
import { foldersHandler } from './routes/folders.get';
import { setupHandler } from './routes/setup.get';
import { videoHandler } from './routes/video.get';

const app = express();

app.use(express.static('public'));
app.use(express.static('assets'));
app.use(express.static('views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.patch('/config', configHandler);
app.get('/folders', foldersHandler);
app.get('/setup', setupHandler);
app.get('/video', videoHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
