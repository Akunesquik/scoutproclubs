import { PLATFORMS, type Platform } from './types';

export interface SearchInput {
  name: string;
  platform: Platform;
  /** Identifiant numérique de club, ou nom de club. */
  club: string;
}

export type ValidationResult =
  | { ok: true; value: SearchInput }
  | { ok: false; field: 'name' | 'platform' | 'club'; message: string };

// Lettres, chiffres, espaces et ponctuation courante des pseudos ; pas de caractères de contrôle.
const NAME_PATTERN = /^[\p{L}\p{N} ._\-']+$/u;

export function validateSearch(raw: { name?: unknown; platform?: unknown; club?: unknown }): ValidationResult {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return { ok: false, field: 'name', message: 'Saisissez le pseudo d’un joueur.' };
  if (name.length < 2 || name.length > 40 || !NAME_PATTERN.test(name)) {
    return { ok: false, field: 'name', message: 'Pseudo invalide : 2 à 40 caractères (lettres, chiffres, espaces, . _ - \').' };
  }

  const platform = typeof raw.platform === 'string' ? raw.platform : '';
  if (!PLATFORMS.some((p) => p.value === platform)) {
    return { ok: false, field: 'platform', message: 'Plateforme non prise en charge.' };
  }

  const club = typeof raw.club === 'string' ? raw.club.trim() : '';
  if (!club) {
    return {
      ok: false,
      field: 'club',
      message: 'Indiquez le club du joueur (nom ou identifiant) : la source ne permet pas de chercher un joueur sans club.',
    };
  }
  if (club.length > 60 || !NAME_PATTERN.test(club)) {
    return { ok: false, field: 'club', message: 'Nom ou identifiant de club invalide.' };
  }

  return { ok: true, value: { name, platform: platform as Platform, club } };
}
