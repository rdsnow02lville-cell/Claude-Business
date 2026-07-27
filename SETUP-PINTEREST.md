# Pinterest Autopost — Setup

The robot lives in this repo and posts one pin from `pins.json` every 3 days,
forever, for free. It needs four secrets before it can run.

## One-time setup

### 1. Pinterest side
1. Convert your Pinterest account to a **Business account** (free, Settings >
   Account management) if it is not one already.
2. Go to https://developers.pinterest.com/apps/ and create an app.
   Purpose: "Publish our own product pins to our own boards."
3. Wait for **Trial access** approval (usually a few days).
4. IMPORTANT: Trial-tier pins are sandbox-only (visible just to you). After
   Trial is granted, request **Standard access** from the app dashboard. This
   requires a short screen recording showing the app authorizing and posting.
   Ask Claude for a walkthrough when you get there.
5. From the app page, note the **App ID** and **App secret key**.
6. Generate a token with scopes `pins:write, boards:read` using the app's
   OAuth flow (the app page has a token generator / "Try it" path). Save the
   **refresh token** it returns.
7. In Pinterest, create a board (e.g. "Medical Practice Management") and grab
   its **board ID** (Claude can fetch it from the API, or it is in the board
   URL via the API explorer).

### 2. GitHub side
Repo > Settings > Secrets and variables > Actions > **New repository secret**,
four times:

| Name | Value |
|---|---|
| PINTEREST_APP_ID | your app id |
| PINTEREST_APP_SECRET | your app secret |
| PINTEREST_REFRESH_TOKEN | the refresh token |
| PINTEREST_BOARD_ID | the board id |

### 3. Test it
Repo > **Actions** tab > "Pinterest autopost" > **Run workflow**. A green run
means a pin was created. During Trial access you will see it in sandbox; after
Standard access, pins are public.

## Maintenance
- The queue in `pins.json` recycles when it reaches the end; Claude can add
  new pins to the file any time.
- Pinterest refresh tokens last about a year; when the workflow starts
  failing with an auth error, regenerate the token and update the secret.
