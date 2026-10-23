import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { AccessError, createAccessAuthenticator } from '../src/lib/server/access.ts';

const settings = {
	teamDomain: 'portfolio-test.cloudflareaccess.com',
	audience: 'portfolio-test-audience',
	ownerEmail: 'owner@example.com'
};
const issuer = `https://${settings.teamDomain}`;
const pair = await generateKeyPair('RS256');
const publicJwk = await exportJWK(pair.publicKey);
const keys = createLocalJWKSet({ keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256' }] });
const authenticate = createAccessAuthenticator(settings, keys);

async function sign(overrides = {}, privateKey = pair.privateKey) {
	const now = Math.floor(Date.now() / 1000);
	return new SignJWT({
		iss: issuer,
		aud: settings.audience,
		sub: 'owner-id',
		email: settings.ownerEmail,
		iat: now,
		exp: now + 300,
		...overrides
	})
		.setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
		.sign(privateKey);
}

function request(token, extraHeaders = {}) {
	return new Request('https://portfolio.example.com/', {
		headers: { ...(token ? { 'cf-access-jwt-assertion': token } : {}), ...extraHeaders }
	});
}

function denied(status) {
	return (error) => error instanceof AccessError && error.status === status;
}

test('accepts a correctly signed token for the owner', async () => {
	assert.deepEqual(await authenticate(request(await sign())), {
		email: settings.ownerEmail,
		subject: 'owner-id'
	});
});

test('normalizes email casing without accepting a different address', async () => {
	const identity = await authenticate(request(await sign({ email: 'OWNER@EXAMPLE.COM' })));
	assert.equal(identity.email, settings.ownerEmail);
});

test('requires a signed token even when an identity header or cookie is supplied', async () => {
	await assert.rejects(
		authenticate(
			request(undefined, {
				'cf-access-authenticated-user-email': settings.ownerEmail,
				cookie: 'CF_Authorization=forged'
			})
		),
		denied(401)
	);
});

test('rejects malformed and unsigned tokens', async () => {
	await assert.rejects(authenticate(request('not-a-token')), denied(401));
	const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
	const payload = Buffer.from(JSON.stringify({ email: settings.ownerEmail })).toString('base64url');
	await assert.rejects(authenticate(request(`${header}.${payload}.`)), denied(401));
});

test('rejects a token signed by an unrelated key', async () => {
	const unrelated = await generateKeyPair('RS256');
	await assert.rejects(authenticate(request(await sign({}, unrelated.privateKey))), denied(401));
});

test('rejects a valid token for a different email', async () => {
	await assert.rejects(
		authenticate(request(await sign({ email: 'someone-else@example.com' }))),
		denied(403)
	);
});

for (const [name, overrides] of [
	['another team', { iss: 'https://other.cloudflareaccess.com' }],
	['another application', { aud: 'another-audience' }],
	['expired session', { exp: Math.floor(Date.now() / 1000) - 60 }],
	['future session', { nbf: Math.floor(Date.now() / 1000) + 300 }],
	['missing expiry', { exp: undefined }],
	['missing identity', { sub: undefined }],
	['missing email', { email: undefined }]
]) {
	test(`rejects ${name}`, async () => {
		await assert.rejects(authenticate(request(await sign(overrides))), denied(401));
	});
}

for (const [name, overrides] of [
	['missing owner', { ownerEmail: '' }],
	['missing audience', { audience: '' }],
	['missing team', { teamDomain: '' }],
	['insecure issuer', { teamDomain: 'http://portfolio-test.cloudflareaccess.com' }],
	['untrusted key server', { teamDomain: 'https://attacker.example.com' }],
	['lookalike hostname', { teamDomain: 'portfolio-test.cloudflareaccess.com.attacker.com' }],
	['issuer with a path', { teamDomain: `${issuer}/other` }],
	['issuer with a query', { teamDomain: `${issuer}/?redirect=other` }]
]) {
	test(`denies access with ${name}`, () => {
		assert.throws(
			() => createAccessAuthenticator({ ...settings, ...overrides }, keys),
			denied(503)
		);
	});
}

test('accepts a configured HTTPS team URL with a trailing slash', async () => {
	const verify = createAccessAuthenticator({ ...settings, teamDomain: `${issuer}/` }, keys);
	assert.equal((await verify(request(await sign()))).subject, 'owner-id');
});
