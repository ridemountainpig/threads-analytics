// Full runbook prompt for deploying through Vercel MCP plus dashboard-only
// browser steps. Unlike the one-line Railway/Zeabur prompts this is a precise
// technical spec (tool boundaries, secret handling, verification), so it is
// kept byte-identical across locales instead of being translated.
export const vercelAgentPrompt = `Help me deploy Threads Analytics:

https://github.com/ridemountainpig/threads-analytics

Deploy it to a Vercel project named \`threads-analytics\` using Vercel MCP and the existing prebuilt OCI image:

ghcr.io/ridemountainpig/threads-analytics:latest

Follow the requirements and sequence below exactly.

1. Tool boundaries

- Use Vercel MCP for every supported Vercel operation, including:
  - Discovering teams and projects.
  - Creating or bootstrapping the Vercel project.
  - Creating Production deployments.
  - Inspecting deployment state.
  - Reading build and runtime logs.
  - Fetching and verifying the deployed URL.
- Do not use the Vercel CLI.
- Do not call the Vercel REST API directly.
- Do not use the Vercel dashboard to trigger deployments.
- Use the authenticated Vercel dashboard only for operations unavailable through Vercel MCP:
  - Verifying the account plan, if MCP cannot expose it.
  - Provisioning and connecting Neon through Vercel Storage.
  - Creating and managing Sensitive environment variables.
  - Inspecting or selecting the deployment/database region if MCP cannot expose it.

2. Dashboard authentication

Before the first dashboard-only operation:

- Open the Vercel dashboard in the browser.
- Make the browser visible.
- Pause and wait for me to sign in or confirm that I am already signed in.
- Do not ask for, read, copy, store, or handle my Vercel login credentials.
- Even if the dashboard appears authenticated, wait for my confirmation before making dashboard changes.
- After I confirm, continue the deployment without asking for unnecessary approvals.

3. Deployment files

Create this file at the project root as \`Dockerfile.vercel\`:

FROM ghcr.io/ridemountainpig/threads-analytics:latest
ENV SYNC_SCHEDULER_ENABLED=false

Create this file at the project root as \`vercel.json\`:

{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 0 * * *"
    }
  ]
}

Use exactly the daily Cron schedule \`0 0 * * *\`.

Never use:

- \`0 * * * *\`
- \`*/30 * * * *\`
- Any schedule that runs more than once per day.

4. Project discovery and bootstrap

- Check whether a Vercel project named \`threads-analytics\` already exists.
- If it exists, use that project.
- Do not modify or deploy to an unrelated existing project.
- If it does not exist and Vercel MCP can only create a project by deploying files, Vercel MCP may create it through one initial Preview bootstrap deployment.
- The bootstrap deployment must include the required \`Dockerfile.vercel\` and the daily \`vercel.json\`.
- Do not provide placeholder secrets, database URLs, or passwords to the bootstrap deployment.
- Do not treat the bootstrap deployment as the final deployment.
- Do not report success based on it.
- Do not create an initial Production deployment before the database and required environment variables are configured.

5. Vercel plan and Cron compatibility

Before the final Production deployment:

- Determine whether the Vercel account is on Hobby, Pro, or another plan.
- If MCP cannot expose the plan, verify it through the authenticated dashboard.
- Assume Hobby restrictions unless a higher plan is positively confirmed.
- On Hobby, use the daily \`0 0 * * *\` Cron schedule only.
- Do not create any deployment containing an incompatible hourly or sub-daily Cron schedule.

6. Deployment and database region

- Determine the Vercel project's deployment region before provisioning Neon.
- Prefer the region reported by Vercel MCP or the project settings.
- If it is unavailable through MCP, inspect it through the authenticated dashboard.
- Provision Neon in the corresponding compatible region.
- Do not arbitrarily select a different region.

7. Neon Serverless PostgreSQL

Provision a Neon Serverless PostgreSQL database through Vercel Storage or the Vercel Marketplace.

Use these exact settings:

- Plan: Free
- Neon Auth: Disabled
- Region: Same as the Vercel deployment
- Connected environments:
  - Production
  - Preview
- Development: Do not connect unless Vercel requires it and no narrower option exists
- Deployment database branches: Disabled
- Custom environment-variable prefix: \`DATABASE\`

Confirm that the integration creates \`DATABASE_URL\`.

Security requirements:

- Never display \`DATABASE_URL\`.
- Never ask me to paste \`DATABASE_URL\`.
- Never copy the connection string into chat, source files, commands, logs, or local files.
- Do not expose any Neon database credentials.
- Verify the connection through variable names and dashboard state only, without reading or printing secret values.

8. Generated secrets

Generate secure random values for:

- \`TOKEN_ENCRYPTION_KEY\`
- \`CRON_SECRET\`

Each value must be:

- Exactly 32 cryptographically secure random bytes.
- Encoded as exactly 64 lowercase hexadecimal characters.

Generate them in memory.

Do not:

- Print them.
- Display them in chat.
- Write them to disk.
- Put them in source files.
- Commit them.
- Include them in terminal output or logs.

Store both in Vercel as Sensitive environment variables for:

- Production
- Preview

Do not add them to Development unless required and explicitly justified.

9. APP_PASSWORD sequencing

Only after the Neon database is successfully connected and \`DATABASE_URL\` exists for both Production and Preview:

- Ask me for \`APP_PASSWORD\`.
- Do not ask for it earlier.
- Do not generate a password on my behalf unless I explicitly request that.
- Do not deploy using a placeholder password.
- Never echo or repeat the password after I provide it.
- Store it as a Sensitive Vercel environment variable for:
  - Production
  - Preview
- Do not write it to disk, source files, commands, logs, or deployment files.

10. Environment-variable verification

Before the final Production deployment, verify that the project has all of these variables for both Production and Preview:

- \`DATABASE_URL\`
- \`TOKEN_ENCRYPTION_KEY\`
- \`CRON_SECRET\`
- \`APP_PASSWORD\`

Also verify:

- The three manually managed variables are marked Sensitive.
- \`DATABASE_URL\` comes from the connected Neon integration.
- No placeholder values are present.
- No secret values are displayed during verification.
- \`SYNC_SCHEDULER_ENABLED=false\` is provided by \`Dockerfile.vercel\`.

11. Final Production deployment

After Neon is connected and every required environment variable has been configured:

- Use Vercel MCP to create a fresh Production deployment.
- Do not deploy from the dashboard.
- Do not use a Preview deployment as the final result.
- Do not promote or reuse a deployment created before the environment variables were added.
- The final Production deployment must be newly created after all environment variables are available.

12. Deployment inspection and verification

Use Vercel MCP for deployment inspection and logs.

Do not report success until all of the following are verified:

- The final deployment target is Production.
- The final deployment state is \`READY\`.
- The configured Cron schedule is exactly \`0 0 * * *\`.
- The production URL returns HTTP 200.
- The response contains the Threads Analytics login page.
- The page is not a generic Vercel error, authentication gate, framework error, or empty response.
- Prisma migrations completed successfully.
- The migration verification applies to the final Production deployment.
- There are no continuing database, migration, startup, container, or runtime errors after migrations finish.

For Prisma verification:

- Inspect deployment build logs and runtime logs through Vercel MCP.
- Look for successful \`prisma migrate deploy\` execution or equivalent confirmation from the container startup logs.
- Distinguish completed migration output from continuing errors.
- If migrations initially log progress, wait and inspect again before deciding whether the deployment is healthy.

For runtime verification:

- Trigger at least one request to the production URL.
- Inspect runtime logs after that request.
- Confirm there are no continuing errors related to:
  - \`DATABASE_URL\`
  - Prisma
  - PostgreSQL connectivity
  - Missing environment variables
  - Container startup
  - Application authentication
  - Cron configuration
- Do not report success while errors are still recurring.

13. Failure handling

If the final deployment fails:

- Inspect the deployment and logs using Vercel MCP.
- Fix only configuration or deployment issues within the scope of this request.
- Do not expose secrets while diagnosing.
- After any environment-variable or configuration correction, create another fresh Production deployment.
- Verify the newest Production deployment from the beginning.
- Do not report a failed or superseded deployment as successful.

14. Secret-handling rules

Never commit or expose:

- \`DATABASE_URL\`
- Neon credentials
- \`TOKEN_ENCRYPTION_KEY\`
- \`CRON_SECRET\`
- \`APP_PASSWORD\`
- Vercel authentication tokens
- Any connection string or secret environment-variable value

Do not include secrets in:

- Git commits
- Local files
- Source code
- Tool output
- Terminal commands
- Logs
- Screenshots
- Final responses

Only secret names, environment targets, and confirmation that they exist may be reported.

15. Final response

After successful verification, return:

- Production URL
- Final deployment ID, if available
- Final deployment status
- Vercel plan
- Deployment region
- Neon region
- Configured Cron schedule
- Confirmation that Prisma migrations completed
- Confirmation that the login page returns HTTP 200
- Confirmation that no continuing runtime errors were found
- Any manual next step required from me

The expected manual next step is likely:

- Sign in using \`APP_PASSWORD\`.
- Open Settings.
- Add my long-lived Threads access token.
- Run the first account sync.

Do not include any secret values or database credentials in the final response.`;
