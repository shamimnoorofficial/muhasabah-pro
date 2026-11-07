# Running checks

Use Node.js 22 or newer and install the locked dependencies with `npm ci`.

Run the offline unit tests and server-side type checks:

```sh
npm test
npm run typecheck
```

For browser tests, install Chromium once and start the Netlify development server:

```sh
npx playwright install chromium
netlify dev --port 8889
```

In another terminal, run `npm run test:ui`, or run `npm run check` to include the
unit tests and TypeScript checks. Browser tests cover mobile and desktop flows
and use stubbed services where appropriate; they do not verify live payment
processing, account authentication, AI translation, or push delivery.

Run `npm audit` to check dependency advisories. Keep `drizzle-orm` and
`drizzle-kit` on the Netlify-compatible `beta` release, with matching exact
versions. Their default stable releases do not include the required database
adapter. Review compatibility before changing these pins, and preserve applied
database migrations.
