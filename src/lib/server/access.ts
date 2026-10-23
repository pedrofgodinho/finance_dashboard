import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface AccessSettings {
	teamDomain: string;
	audience: string;
	ownerEmail: string;
}

export interface AccessIdentity {
	email: string;
	subject: string;
}

export class AccessError extends Error {
	readonly status: 401 | 403 | 503;

	constructor(status: 401 | 403 | 503, message: string) {
		super(message);
		this.name = 'AccessError';
		this.status = status;
	}
}

export function createAccessAuthenticator(settings: AccessSettings, keys?: JWTVerifyGetKey) {
	const ownerEmail = settings.ownerEmail.trim().toLowerCase();
	const audience = settings.audience.trim();
	const teamDomain = settings.teamDomain.trim();

	if (!ownerEmail || !audience || !teamDomain || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
		throw new AccessError(503, 'Access protection is not configured.');
	}

	let issuer: URL;
	try {
		issuer = new URL(teamDomain.includes('://') ? teamDomain : `https://${teamDomain}`);
	} catch {
		throw new AccessError(503, 'Access protection is not configured.');
	}

	// Only the configured Cloudflare team can supply verification keys.
	if (
		issuer.protocol !== 'https:' ||
		!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer.hostname) ||
		issuer.port ||
		issuer.username ||
		issuer.password ||
		issuer.pathname !== '/' ||
		issuer.search ||
		issuer.hash
	) {
		throw new AccessError(503, 'Access protection is not configured.');
	}

	const verificationKeys = keys ?? createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer));

	return async (request: Request): Promise<AccessIdentity> => {
		const token = request.headers.get('cf-access-jwt-assertion');
		if (!token) {
			throw new AccessError(401, 'Cloudflare Access sign-in is required.');
		}

		let identity: AccessIdentity;
		try {
			const { payload } = await jwtVerify(token, verificationKeys, {
				issuer: issuer.origin,
				audience,
				algorithms: ['RS256'],
				requiredClaims: ['iss', 'aud', 'exp', 'iat', 'sub', 'email'],
				clockTolerance: 5
			});

			if (typeof payload.email !== 'string' || typeof payload.sub !== 'string' || !payload.sub) {
				throw new Error('Missing user identity.');
			}

			identity = { email: payload.email.trim().toLowerCase(), subject: payload.sub };
		} catch {
			// Never return JWT contents or verification details to the caller.
			throw new AccessError(401, 'Cloudflare Access sign-in is required.');
		}

		if (identity.email !== ownerEmail) {
			throw new AccessError(403, 'This account does not have access.');
		}

		return identity;
	};
}
