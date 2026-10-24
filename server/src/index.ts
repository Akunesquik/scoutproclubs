import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
createApp(config).listen(config.port, () => {
  console.log(`API ScoutProClubs sur http://localhost:${config.port} (connecteur EA non officiel : ${config.eaUnofficialEnabled ? 'ACTIVÉ' : 'désactivé'})`);
});
