# Auth0 custom Universal Login page template

`login-page-template.html` is a Universal Login **page template** (Liquid) that
wraps Auth0's hosted login widget in the OpenAux brand background — the same
diagonal tiled "OPENAUX / AUXOPEN" wordmark used by
[components/layout/brand-background.tsx](../components/layout/brand-background.tsx),
reimplemented in vanilla JS/CSS since Auth0 renders this page outside of Next.js.

It only replaces the page shell (background, fonts, card frame) around the
widget markers — it does **not** replace Auth0's own login form, so it works
with the default database/social connections, MFA, and passwordless flows
without extra wiring.

## Requirements

- A [custom domain](https://auth0.com/docs/customize/custom-domains) configured
  for the tenant (e.g. `auth.openaux.net`). Auth0 only renders page templates
  on a custom domain — visiting the default `*.auth0.com` domain ignores it.
- New Universal Login experience enabled (Branding → Universal Login).

## Deploy

There is no dashboard editor for page templates — they're set through the
[Auth0 CLI](https://github.com/auth0/auth0-cli) or the Management API.

**Option A — Auth0 CLI (recommended):**

```sh
auth0 login
Get-Content -Raw auth0/login-page-template.html | auth0 universal-login templates update
```

(`auth0 universal-login customize` now opens the newer ACUL/component
customization flow instead of the classic HTML page template, so use
`templates update` for this file specifically.)

**Option B — Management API:**

Get a Management API token with the `update:branding` scope, then:

```sh
auth0 api put "branding/templates/universal-login" \
  --data "$(cat auth0/login-page-template.html)"
```

or with `curl`:

```sh
curl --request PUT \
  --url "https://auth.openaux.net/api/v2/branding/templates/universal-login" \
  --header "authorization: Bearer MGMT_API_ACCESS_TOKEN" \
  --header "content-type: text/html" \
  --data-binary @auth0/login-page-template.html
```

Then visit `https://auth.openaux.net/authorize?...` (not the tenant's default
`*.auth0.com` domain) to confirm the background renders and the widget still
submits correctly. Use `auth0 universal-login templates show` to confirm what's
currently deployed.

## Notes

- Colors are copied from [app/globals.css](../app/globals.css) (light theme,
  with a `prefers-color-scheme: dark` variant). If the theme tokens change,
  update the `:root` values here to match.
- `oklch()` colors are used where supported, with hex fallbacks for older
  browsers.
- The `{%- auth0:head -%}` and `{%- auth0:widget -%}` Liquid tags are required
  by Auth0 and must not be removed.

# Auth0 custom email templates

`email-templates/verify-email.html` is a branded transactional email body
(table-based HTML, inline styles) for Auth0's **Email Templates**
(Branding → Email Templates), separate from the Universal Login page above.

Email clients don't support CSS transforms, `vmax` units, or background
tiling reliably (especially Outlook desktop), so the diagonal wordmark
background isn't reproduced here — instead the footer has a plain-text
"OPENAUX · AUXOPEN" strip as a lighter nod to the same branding. Colors are
the same hex values used as the login template's fallbacks.

**Deploy with the Auth0 CLI:**

```sh
auth0 email templates update verify_email \
  --enabled=true \
  --body "$(cat auth0/email-templates/verify-email.html)" \
  --subject "Verify your email for OpenAux"
```

`email-templates/welcome-email.html` is the same shell for the `welcome_email`
template, sent after signup. It has no action link/button target since Auth0
doesn't pass one for this template — the button links to the site directly.

```sh
auth0 email templates update welcome_email \
  --enabled=true \
  --body "$(cat auth0/email-templates/welcome-email.html)" \
  --subject "Welcome to OpenAux"
```

**Adapting for other template types:** each Auth0 email template (`welcome_email`,
`reset_email`, `blocked_account`, `stolen_credentials`, `enrollment_email`,
`mfa_oob_code`, `user_invitation`, etc.) accepts different Liquid variables —
copy this file's card/footer shell and swap the body copy and variables per
[Auth0's email template variables](https://auth0.com/docs/customize/email/email-templates):
most action-link emails use `{{ url }}`, code-based ones use `{{ code }}`, and
security emails (`blocked_account`, `stolen_credentials`) use
`{{ user.email }}`, `{{ friendly_ip }}`, `{{ os_name }}`, `{{ browser_name }}`.
`welcome_email` has no action link.

# Block login until email is verified

App-level API routes already reject unverified sessions via
[requireVerifiedEmailSession](../src/api/auth.ts), but that only stops access
*after* a session exists. `actions/require-verified-email.js` is an Auth0
**Post Login Action** that denies the login itself — via `api.access.deny()`
— so an unverified user never gets tokens/a session at all and instead sees
Auth0's access-denied error page.

**Deploy with the Auth0 CLI:**

```sh
# 1. Create the action (only needed once; prints the new action's id)
auth0 actions create \
  --name "Require verified email" \
  --trigger post-login \
  --code "$(cat auth0/actions/require-verified-email.js)" \
  --runtime node18

# 2. Deploy the action (repeat after any code change)
auth0 actions deploy <action-id>
```

**Bind it to the Login flow** — the CLI has no `bind` command, so use the
Management API (scope `update:actions`) or the Dashboard:

```sh
auth0 api patch "actions/triggers/post-login/bindings" \
  --data '{"bindings":[{"ref":{"type":"action_id","value":"<action-id>"},"display_name":"Require verified email"}]}'
```

Or in the Dashboard: **Actions → Flows → Login**, drag "Require verified
email" from the Custom tab into the flow, then **Apply**.

**Notes:**

- This only affects database/enterprise connections where `email_verified`
  can be `false`. Verified social connections (Google, etc.) are unaffected.
- Users who fail this check still need a way to re-trigger the verification
  email — point them at the "Resend verification email" flow (Management API
  `POST /api/v2/jobs/verification-email`) rather than leaving them stuck.
