import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');

createApp(config, undefined, distDir).listen(config.port, () => {
  console.log(`ScoutProClubs sur le port ${config.port} (connecteur EA non officiel : ${config.eaUnofficialEnabled ? 'ACTIVÉ' : 'désactivé'})`);
});
