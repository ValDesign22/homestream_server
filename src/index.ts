import 'dotenv/config';

import express from 'express';

import { configHandler } from './routes/config.patch';
import { storesHandler } from './routes/stores.get';
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
app.get('/stores', storesHandler);
app.get('/video', videoHandler);

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} - ${res.statusCode}`);
    console.log('Headers:', res.getHeaders());
    console.log('Body:', req.body);
  });  

  next();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
