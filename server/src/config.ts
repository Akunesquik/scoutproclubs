export interface ServerConfig {
  port: number;
  /** Active le connecteur NON OFFICIEL vers proclubs.ea.com. Désactivé par défaut. */
  eaUnofficialEnabled: boolean;
  eaBaseUrl: string;
  timeoutMs: number;
  rateLimitPerMinute: number;
  /** À activer derrière le proxy d'un hébergeur (Render met RENDER=true). */
  trustProxy: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: Number(env.PORT) || 3001,
    trustProxy: env.TRUST_PROXY === 'true' || env.RENDER === 'true',
    eaUnofficialEnabled: env.EA_UNOFFICIAL_ENABLED !== 'false',
    eaBaseUrl: env.EA_BASE_URL || 'https://proclubs.ea.com/api/fc',
    timeoutMs: Number(env.EA_TIMEOUT_MS) || 8000,
    rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE) || 20,
  };
}
