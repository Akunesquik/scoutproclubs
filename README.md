# ScoutProClubs

Interface de recherche de joueurs **EA Sports FC Clubs Pro** (React + Vite + TypeScript, backend Node/Express).

## Lancer le projet

```bash
npm install
npm run dev        # front http://localhost:5173 + API http://localhost:3001
npm test           # tests Vitest
npm run build      # typecheck + build du front
```

Windows PowerShell : activer le connecteur non officiel avec `$env:EA_UNOFFICIAL_ENABLED='true'; npm run dev`.

| Variable | Défaut | Rôle |
|---|---|---|
| `EA_UNOFFICIAL_ENABLED` | `false` | Active le connecteur **non officiel** vers `proclubs.ea.com` |
| `EA_BASE_URL` | `https://proclubs.ea.com/api/fc` | Base des endpoints non officiels |
| `EA_TIMEOUT_MS` | `8000` | Délai d'attente des appels EA |
| `RATE_LIMIT_PER_MINUTE` | `20` | Limite par IP sur `/api/players` |
| `PORT` | `3001` | Port de l'API |

Aucun secret n'est nécessaire ni exposé au navigateur.

## Statut des sources de données (audit)

- **API officielle EA FC Clubs Pro : aucune trouvée.** Aucune documentation publique officielle, aucun portail développeur accessible (`developer.ea.com` n'était pas joignable lors de l'audit), aucune clé d'API publique. Une API officielle ne peut donc pas être revendiquée.
- **Source utilisée : [`proclubs-sdk`](https://github.com/alex-jordan547/proclubs-sdk)**, SDK communautaire **non officiel** (non affilié à EA) qui lit les endpoints non documentés de `proclubs.ea.com`. Ils n'ont aucune garantie de stabilité (EA a déjà changé des chemins, et `common-gen4` est déprécié) et leur usage peut contrevenir aux conditions d'utilisation d'EA — à vérifier avant tout usage public. Le connecteur est actif par défaut dans ce projet, à la demande de son auteur.
- **Vérifié le 2026-10-24** : recherche de club, effectif et matchs récents renvoient de vraies données via le SDK pour un club existant. Le format peut changer à tout moment ; tout champ absent devient « Non disponible », jamais 0.
- **Recherche par pseudo seul : impossible** avec ce qui est connu. Les endpoints cherchent un *club* par nom, puis listent ses membres. ScoutProClubs demande donc pseudo + club (nom ou identifiant) + plateforme.
- **Impossible / non disponible** : identifiant public du joueur, avatar, V/N/D individuels, statistiques de carrière vs saison séparées.

## Mode démo

Sans `EA_UNOFFICIAL_ENABLED`, seul le pseudo `DemoPlayer` (club quelconque) renvoie une **fixture fictive**, clairement badgée « DÉMO ». Tout autre pseudo renvoie une erreur explicite.

## Fonctionnement

`GET /api/players?name=&platform=&club=` → validation (partagée front/back, `shared/validation.ts`) → recherche du club (erreur `AMBIGUOUS_CLUB` avec candidats si plusieurs) → effectif → matchs (meilleur effort : s'il échoue, profil et stats sont renvoyés avec l'historique marqué indisponible) → normalisation → JSON interne (`shared/types.ts`).

Erreurs gérées : champ invalide, joueur/club introuvable, clubs ambigus, source désactivée, inaccessible, délai dépassé, réponse invalide, limite de requêtes (côté ScoutProClubs et côté source).

## Structure

```
shared/   types et validation communs
server/src/  app.ts, routes/, services/ (eaClubsService, normalize, demoFixture)
src/      app/, components/, services/, styles/
```

Les fixtures des tests sont fabriquées à la main : ce ne sont pas des données EA actuelles.
