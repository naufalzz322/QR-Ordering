# Schedule a daily demo reseed with cron-job.org

Warning: the reseed endpoint deletes all current orders, archives, menu items, tables, users, and outlets, then recreates sample data. Only use this with the dedicated demo database.

## Before creating the job

1. Generate a long random secret, for example with `openssl rand -hex 32`.
2. Set it as `CRON_SECRET` in the deployed app's environment and redeploy.
3. Create an API key in cron-job.org Console → Settings.
4. Ensure any existing jobs for `/api/cron/keep-alive` or `/api/admin/orders/archive` also send `Authorization: Bearer <CRON_SECRET>`; those endpoints now reject requests without it.

## Create the job with cron-job.org's API

Run in a POSIX-compatible shell with `curl` and `jq` installed. The prompts hide secret input and avoid writing the key values into shell history. The created job makes a POST request every day at 00:00 WIB (`Asia/Jakarta`).

```sh
read -rsp 'cron-job.org API key: ' CRON_JOB_ORG_API_KEY; printf '\n'
read -rp 'Deployed app URL (e.g. https://your-domain.example): ' APP_URL
read -rsp 'App CRON_SECRET: ' CRON_SECRET; printf '\n'

jq -n --arg url "${APP_URL%/}/api/cron/reseed" --arg auth "Bearer $CRON_SECRET" '{job:{title:"QR Ordering Demo Daily Reseed",url:$url,enabled:true,saveResponses:true,requestMethod:1,requestTimeout:300,extendedData:{headers:{Authorization:$auth},body:""},schedule:{timezone:"Asia/Jakarta",expiresAt:0,hours:[0],mdays:[-1],minutes:[0],months:[-1],wdays:[-1]}}}' | curl --fail-with-body --request PUT --url 'https://api.cron-job.org/jobs' --header "Authorization: Bearer $CRON_JOB_ORG_API_KEY" --header 'Content-Type: application/json' --data-binary @-
```

On success, the API returns a JSON object containing `jobId`. Check the job and its next execution time in cron-job.org Console. The cron-job.org API key is used only to create the job; the app's `CRON_SECRET` is sent by the scheduled request to authenticate with your app.

## Test the app endpoint manually

This will immediately reset the demo database. Only run it when you intend to do that:

```sh
read -rsp 'App CRON_SECRET: ' CRON_SECRET; printf '\n'
curl --fail-with-body --request POST --url 'https://YOUR-DEPLOYED-DOMAIN/api/cron/reseed' --header "Authorization: Bearer $CRON_SECRET"
```

A successful request returns HTTP 200 and JSON with `"ok":true`. Missing or invalid credentials return HTTP 401. `GET /api/cron/reseed` returns HTTP 405.

Implementation: `app/api/cron/reseed/route.ts`, `prisma/seed.ts`, and `lib/cronAuth.ts`.
