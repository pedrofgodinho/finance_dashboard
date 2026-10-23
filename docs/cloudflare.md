# Private Cloudflare deployment

The target is a single-owner dashboard on Cloudflare Workers Free at `portfolio.pmfg.pt`.
Cloudflare Access supplies email-code sign-in. There is no application password database.

## Applied configuration

| Resource              | Identifier                             |
| --------------------- | -------------------------------------- |
| Worker                | `finance-dashboard`                    |
| Immutable Worker ID   | `bfd8b926c4cb45138ff6f569f0424c1a`     |
| Access application    | `38142753-a12c-4954-91e7-788aa6e4055c` |
| Owner policy          | `b39bf19c-e542-44f7-8476-a84a8d5cef1d` |
| One-time PIN provider | `2ed602d5-4419-4d37-8034-8f9a2d3d6e1e` |
| Team hostname         | `pmfgodinho.cloudflareaccess.com`      |
| Session duration      | 24 hours                               |

The application is attached to the Worker itself with a `worker` destination, rather than a single
hostname. Its sole Allow policy includes the owner email and requires the one-time PIN provider.
That provider is also the only allowed login method. Worker-wide protection covers any future
hostnames added to the same Worker.

The local `.env.cloudflare.local` token was used only for account setup. It is ignored by version
control and is not a Worker binding. It may be revoked after setup; serving the application and
ordinary Wrangler deployments do not need that Access-administration token.

## Account setup

1. Sign in to Cloudflare and enable the **Zero Trust Free** plan at
   <https://one.dash.cloudflare.com/>. Complete the account onboarding yourself if Cloudflare asks for
   billing details or acceptance of terms. Record the team hostname, such as
   `your-team.cloudflareaccess.com`.
2. Under **Zero Trust > Integrations > Identity providers**, add **One-time PIN**.
3. In this checkout, authenticate Wrangler:

   ```sh
   npx wrangler login --scopes account:read user:read workers:write workers_scripts:write workers_routes:write zone:read
   ```

The configured account owns `pmfg.pt`. Wrangler creates the custom-domain route and manages its TLS
certificate. No paid Worker or database is needed for this phase.

## Deploy and enable the Access policy

1. Run `npm run deploy`. With empty Access settings, the server returns **503** and does not render the
   dashboard. This allows the Worker to exist before its Access application is configured.
2. Open **Workers & Pages > finance-dashboard > Access**, protect the Worker, and choose **All traffic**.
   Worker-level protection covers its custom domains, routes, production URL, and preview URLs.
3. Edit the resulting application in Zero Trust. Configure exactly one Allow policy with an **Emails**
   rule for `pedro.fernandez.godinho@gmail.com`. Restrict the application's login method to
   **One-time PIN**. Remove broad account-member, email-domain, Everyone, or Bypass policies from this
   application. Do not alter Access policies protecting unrelated applications.
4. Copy the application's **Application Audience (AUD)** tag from its additional settings.
5. Set the following private runtime variables in `wrangler.jsonc`, then run `npm run gen` and
   `npm run deploy`:

   | Variable                | Value                                                      |
   | ----------------------- | ---------------------------------------------------------- |
   | `OWNER_EMAIL`           | `pedro.fernandez.godinho@gmail.com`                        |
   | `CF_ACCESS_TEAM_DOMAIN` | Your team's `*.cloudflareaccess.com` hostname              |
   | `CF_ACCESS_AUD`         | The audience tag of the application protecting this Worker |

These values identify the owner and trusted Access application; they are not API credentials. Never
place a Cloudflare API token, private signing key, password, or session cookie in Wrangler vars or
tracked files. `.dev.vars` and local Wrangler state are ignored by version control.

## Verification

- In a signed-out browser, the custom domain and a server-data URL such as `/__data.json` must show
  Access sign-in or deny access, without returning dashboard data.
- Sign in with the owner email and confirm that the dashboard shows that address and offers Sign out.
- Another email must not gain access. The OTP page may display the same acknowledgement for allowed
  and denied email addresses; that acknowledgement does not prove access was granted.
- Production `workers.dev` and preview URLs are disabled in `wrangler.jsonc`. Any future routes must
  remain covered by the Worker-level policy.
- The application independently verifies signed JWTs. Missing, malformed, expired, wrong-team,
  wrong-audience, or forged tokens are rejected. A signed token for another email is denied.
- Private server responses, including authentication failures, must contain
  `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`.

Run `npm run validate` for type, formatting, lint, authentication, and build checks. Run
`npm run deploy:check` to verify that Wrangler can bundle the resulting Worker without publishing.

Cloudflare Access is the outer gate for the entire application, including static assets. The server
hook is a second gate for dynamic pages, data requests, and future API routes. Private routes must
remain server rendered; the root layout disables prerendering.

## Local development

`npm run dev` bypasses sign-in only when Vite is in development mode and the request uses a loopback
hostname. Never expose this development server publicly. Production builds cannot enable this bypass
through an environment variable.

`npm run preview` runs the built app in the local Cloudflare runtime on port 4173 and enforces
production authentication. You can copy `.dev.vars.example` to `.dev.vars` for local runtime settings.

## References

- [SvelteKit Cloudflare adapter](https://svelte.dev/docs/kit/adapter-cloudflare)
- [Worker-level Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Email-code login](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)
- [Access JWT verification](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
