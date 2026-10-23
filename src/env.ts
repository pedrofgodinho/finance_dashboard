import { defineEnvVars } from '@sveltejs/kit/env';

const optionalString = (value: string | undefined) => value?.trim() ?? '';

export const variables = defineEnvVars({
	OWNER_EMAIL: {
		schema: optionalString,
		description: 'The only email address allowed to use the dashboard.'
	},
	CF_ACCESS_TEAM_DOMAIN: {
		schema: optionalString,
		description: 'Cloudflare Access team hostname, such as your-team.cloudflareaccess.com.'
	},
	CF_ACCESS_AUD: {
		schema: optionalString,
		description: 'The audience tag of the Access application protecting this Worker.'
	}
});
