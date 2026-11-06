/* Web App Origin Association for the manifest's "scope_extensions":
 * confirms that the Muhasabah Plus web app may also handle links on the site's other origins. */
import type { Config } from '@netlify/functions';

export default async () =>
  Response.json(
    { web_apps: [{ web_app_identity: 'https://muhasabah-plus.app/' }] },
    { headers: { 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } },
  );

export const config: Config = { path: '/.well-known/web-app-origin-association', method: 'GET' };
