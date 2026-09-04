# whatufind-server

Express + native MongoDB driver API for WhatUFind.

## Structure

```
index.js                  → app setup, mounts every route, error handler
src/
  config/db.js             → MongoDB connection (cached across requests)
  middleware/
    ensureDb.js             → makes sure the DB is connected before routes run
    asyncHandler.js         → wraps async route handlers so errors reach errorHandler
    errorHandler.js         → single place that formats error responses
  routes/
    users.routes.js
    posts.routes.js
    services.routes.js
    products.routes.js
    education.routes.js
    skills.routes.js
    experience.routes.js
    records.routes.js
    interests.routes.js
    about.routes.js
```

Every route, path, method and response shape is unchanged from the previous
single-file `index.js` — this was a structure refactor, not an API change, so
the existing frontend keeps working without modification.

## Local development

```bash
npm install
cp .env.example .env   # fill in USER_NAME / USER_PASS (MongoDB Atlas)
npm start
```

Server runs on `https://whatyoufind-updated-server.vercel.app` by default (or `PORT` from `.env`).

## Deploying

This is already wired for Vercel (`vercel.json` at the repo root, entry point
`index.js`) — push to your connected Git repo, or run `vercel --prod` from
this folder. Make sure `USER_NAME` and `USER_PASS` are set under
Project → Settings → Environment Variables on Vercel (same names as before).

## Notes from the refactor

- Fixed a bug in `GET /getProfilePic/:email` where profile pictures were
  "sorted" with a comparator that always returned `-1` (not a real sort) —
  now uses a proper `.reverse()` so the most recently added picture is first.
- Added a catch-all 404 handler and a centralized error handler, so a
  thrown error now returns a JSON `{ success: false, message }` instead of
  crashing the request or hanging.
- No dependency or environment-variable changes — `USER_NAME` / `USER_PASS`
  keep the same names Vercel already has configured.
