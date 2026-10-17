# Atom — web client

Angular 22 single-page app using standalone components, zoneless change detection, signals,
`httpResource`, Signal Forms and Angular Material 3. See the [root README](../README.md) for
the full project overview.

```bash
npm install
npm start          # dev server on http://localhost:4200, proxies /api to :8080
npm run test:ci    # Vitest unit tests
npm run lint       # angular-eslint
npm run build      # production build in dist/atom/browser
```

The M3 theme lives in `src/styles.scss`; the palette in `src/styles/_theme-colors.scss` was
generated with `ng generate @angular/material:theme-color`.
