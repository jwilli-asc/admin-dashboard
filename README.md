This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Google sign-in setup

The landing page uses Google's rendered **Sign in with Google** button and
passes the resulting credential to Clerk. Before it can be used, configure the
same Google OAuth client in both services:

1. In Clerk, go to **SSO connections** and add a Google connection for all
   users. Enable sign-up and sign-in, turn on **Use custom credentials**, and
   save the Clerk-provided authorized redirect URI.
2. In Google Cloud Console, create a Web application OAuth client. Add each
   local and production site URL as an authorized JavaScript origin, and paste
   the exact Clerk-provided URI as its authorized redirect URI.
3. Paste the Google client ID into the Clerk connection and add it to
   `.env.local`:

   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```

Do not add the Google client secret to `.env.local`; it belongs only in Clerk.
After Google authentication succeeds, Clerk always redirects the user to
`/dashboard`.

## Google Workspace dashboard data

The dashboard can display the signed-in user's upcoming Google Calendar events
and recently modified Google Drive file metadata. It uses these read-only OAuth
scopes:

- `https://www.googleapis.com/auth/calendar.events.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

For the integration to work, configure the same Google OAuth client that Clerk
uses for sign-in:

1. In Google Cloud Console, enable both the **Google Calendar API** and the
   **Google Drive API** for the project.
2. Add the two scopes above to the OAuth consent screen. If the app remains in
   testing, add each ASC admin as a test user.
3. In Clerk's Google SSO connection (with custom credentials enabled), add the
   same scopes in the connection's **Scopes** field and save.
4. Each admin must visit `/account` and reconnect their Google account to grant
   the new permissions. The dashboard will then fetch data server-side using a
   short-lived Clerk-managed access token.

The Drive scope intentionally reads only file metadata: names, file types,
modified times, and Drive links. The application does not download file
contents.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
