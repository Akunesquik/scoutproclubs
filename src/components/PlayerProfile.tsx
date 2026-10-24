import type { PlayerResult } from '../../shared/types';
import { NOT_AVAILABLE, PLATFORM_LABELS } from '../services/format';

export function PlayerProfile({ player }: { player: PlayerResult }) {
  const { profile, club, source } = player;
  const isDemo = source.kind === 'demo-fixture';
  return (
    <section className="card profile" aria-labelledby="profile-title">
      <div className={`badge ${isDemo ? 'badge--warn' : ''}`}>{isDemo ? 'DÉMO — ' : ''}{source.label}</div>
      <h2 id="profile-title">{profile.name}</h2>
      <dl className="facts">
        <div><dt>Plateforme</dt><dd>{PLATFORM_LABELS[profile.platform] ?? profile.platform}</dd></div>
        <div><dt>Poste</dt><dd>{profile.position ?? NOT_AVAILABLE}</dd></div>
        <div><dt>Club</dt><dd>{club ? club.name ?? NOT_AVAILABLE : NOT_AVAILABLE}</dd></div>
        <div><dt>Identifiant du club</dt><dd>{club?.id ?? NOT_AVAILABLE}</dd></div>
        <div><dt>Avatar</dt><dd>{NOT_AVAILABLE}</dd></div>
        <div><dt>Identifiant du joueur</dt><dd>{NOT_AVAILABLE}</dd></div>
      </dl>
    </section>
  );
}
