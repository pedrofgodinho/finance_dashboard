import { dev } from '$app/env';
import { CF_ACCESS_AUD, CF_ACCESS_TEAM_DOMAIN, OWNER_EMAIL } from '$app/env/private';
import { AccessError, createAccessAuthenticator } from '#lib/server/access.js';
import type { Handle } from '@sveltejs/kit/hooks';

const privateHeaders = {
	'cache-control': 'private, no-store',
	'x-robots-tag': 'noindex, nofollow, noarchive',
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'no-referrer'
};

let authenticate: ReturnType<typeof createAccessAuthenticator> | undefined;

export const handle: Handle = async ({ event, resolve }) => {
	// `dev` is compiled out of production builds. No environment variable can enable this bypass.
	if (dev && ['localhost', '127.0.0.1', '[::1]'].includes(event.url.hostname)) {
		event.locals.user = {
			email: OWNER_EMAIL || 'developer@localhost',
			subject: 'local-development'
		};
	} else {
		try {
			authenticate ??= createAccessAuthenticator({
				teamDomain: CF_ACCESS_TEAM_DOMAIN,
				audience: CF_ACCESS_AUD,
				ownerEmail: OWNER_EMAIL
			});
			event.locals.user = await authenticate(event.request);
		} catch (error) {
			if (!(error instanceof AccessError)) throw error;
			return new Response(error.message, {
				status: error.status,
				headers: { ...privateHeaders, 'content-type': 'text/plain; charset=utf-8' }
			});
		}
	}

	const resolved = await resolve(event);
	const response = new Response(resolved.body, resolved);
	for (const [name, value] of Object.entries(privateHeaders)) response.headers.set(name, value);
	return response;
};
