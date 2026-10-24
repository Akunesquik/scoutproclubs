import { useState, type FormEvent } from 'react';
import { PLATFORMS, type Platform } from '../../shared/types';
import { validateSearch, type SearchInput } from '../../shared/validation';

interface Props {
  loading: boolean;
  onSearch: (input: SearchInput) => void;
  initialName?: string;
  initialClub?: string;
}

export function PlayerSearch({ loading, onSearch, initialName = '', initialClub = '' }: Props) {
  const [name, setName] = useState(initialName);
  const [club, setClub] = useState(initialClub);
  const [platform, setPlatform] = useState<Platform>('common-gen5');
  const [error, setError] = useState<{ field: string; message: string } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = validateSearch({ name, club, platform });
    if (!result.ok) return setError({ field: result.field, message: result.message });
    setError(null);
    onSearch(result.value);
  }

  const invalid = (field: string) => (error?.field === field ? true : undefined);

  return (
    <form className="search" onSubmit={submit} noValidate>
      <div className="field field--grow">
        <label htmlFor="player-name">Pseudo du joueur</label>
        <input id="player-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" aria-invalid={invalid('name')} aria-describedby={error ? 'search-error' : undefined} placeholder="ex. DemoPlayer" />
      </div>
      <div className="field field--grow">
        <label htmlFor="club">Club (nom ou identifiant)</label>
        <input id="club" value={club} onChange={(e) => setClub(e.target.value)} autoComplete="off" aria-invalid={invalid('club')} aria-describedby={error ? 'search-error' : undefined} placeholder="ex. Demo FC" />
      </div>
      <div className="field">
        <label htmlFor="platform">Plateforme</label>
        <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn" disabled={loading}>Rechercher</button>
      {error && (
        <p id="search-error" role="alert" className="field-error">{error.message}</p>
      )}
    </form>
  );
}
