import { validateSearch } from './validation';

const base = { platform: 'common-gen5', club: 'Demo FC' };

describe('validateSearch', () => {
  it('refuse un pseudo vide', () => {
    const r = validateSearch({ ...base, name: '   ' });
    expect(r).toMatchObject({ ok: false, field: 'name' });
  });
  it('refuse les caractères invalides et les pseudos trop longs', () => {
    expect(validateSearch({ ...base, name: '<script>' }).ok).toBe(false);
    expect(validateSearch({ ...base, name: 'a'.repeat(41) }).ok).toBe(false);
  });
  it('exige un club', () => {
    expect(validateSearch({ name: 'Zed', platform: 'common-gen5', club: '' })).toMatchObject({ ok: false, field: 'club' });
  });
  it('refuse une plateforme inconnue', () => {
    expect(validateSearch({ ...base, name: 'Zed', platform: 'xyz' })).toMatchObject({ ok: false, field: 'platform' });
  });
  it('accepte et nettoie une saisie valide', () => {
    expect(validateSearch({ ...base, name: '  Zed_9 ' })).toEqual({ ok: true, value: { name: 'Zed_9', platform: 'common-gen5', club: 'Demo FC' } });
  });
});
