import type { ApiErrorBody, PlayerResult } from '../../shared/types';
import type { SearchInput } from '../../shared/validation';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly candidates?: { id: string; name: string }[],
  ) {
    super(message);
  }
}

export async function fetchPlayer(input: SearchInput, signal?: AbortSignal): Promise<PlayerResult> {
  const query = new URLSearchParams({ name: input.name, platform: input.platform, club: input.club });
  let res: Response;
  try {
    res = await fetch(`/api/players?${query}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('Impossible de joindre le serveur ScoutProClubs.', 'NETWORK');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(body?.error?.message ?? `Erreur serveur (HTTP ${res.status}).`, body?.error?.code ?? 'INTERNAL', body?.error?.candidates);
  }
  return (await res.json()) as PlayerResult;
}
