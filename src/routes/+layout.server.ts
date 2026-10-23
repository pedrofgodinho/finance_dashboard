import { dev } from '$app/env';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	user: { email: locals.user.email },
	development: dev
});
