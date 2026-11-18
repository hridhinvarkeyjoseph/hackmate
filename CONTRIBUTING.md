# Contributing to Hackmate

Thanks for helping students find better hackathons.

## Get started

```bash
npm install
npm run dev
```

## Before you open a pull request

```bash
npm run lint
npm test
npm run test:e2e
```

- Keep each pull request to one change.
- Put logic in `src/lib` with a unit test beside it.
- Add a browser test in `e2e` when a user journey changes.
- Treat data from feeds, backups and share links as untrusted.
- Use commit messages like `fix(near-me): hide closed listings`.
