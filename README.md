# Studio Français on Vercel

The family edition of Studio Français uses its own parent and student sign-ins. The French practice, listening audio, and speaking warm-ups are included. Both people can add shared topics, and the parent cannot open the student’s practice API.

## Hosting

Deploy as a Next.js project on Vercel with an attached **private** Blob store. Use the store credentials supplied by Vercel and set `STUDIO_ORIGIN` to the canonical HTTPS origin. Set `STUDIO_SESSION_KEY` to at least 32 random bytes encoded as text and `STUDIO_SETUP_HASH` to the SHA-256 hex digest of a one-time 24-byte base64url setup token. Give the parent the token in a link ending with `/join#setup=TOKEN`. It can be used once. After setting a password, the parent can create a seven-day student invitation in Studio Français.

The app uses a private store for password digests, topics, and practice records. Anonymous requests receive the sign-in screen. Typed practice responses are evaluated in memory. The store keeps response outcomes and enough recent practice to resume a round. This family edition supports one parent and one student.

For local development, set the two secrets, set `STUDIO_ORIGIN` to your local browser origin, and set `STUDIO_LOCAL_DATA` to a test directory. The local file adapter is disabled on Vercel.

```sh
npm ci
npm run dev
```
