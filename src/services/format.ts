export const PLATFORM_LABELS: Record<string, string> = {
  'common-gen5': 'PS5 / Xbox Series / PC',
  'common-gen4': 'PS4 / Xbox One',
  nx: 'Switch',
};

export const NOT_AVAILABLE = 'Non disponible';

export function formatValue(v: number | null, digits = 0): string {
  return v === null ? NOT_AVAILABLE : v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatDate(iso: string | null): string {
  if (!iso) return NOT_AVAILABLE;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
