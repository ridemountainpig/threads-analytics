# Security Policy

## Supported Versions

Threads Analytics is released continuously. Security fixes land on `main` and ship in the `ghcr.io/ridemountainpig/threads-analytics:latest` image. Only the latest version is supported, so update your deployment before reporting an issue (see [Updating an existing deployment](./README.md#updating-an-existing-deployment)).

## Reporting a Vulnerability

Please do not open a public issue for security problems. Report them privately through [GitHub's vulnerability reporting form](https://github.com/ridemountainpig/threads-analytics/security/advisories/new).

Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- The affected version (image tag or commit SHA) and deployment platform

You can expect an acknowledgement within 7 days. Once a fix is released, the advisory will be published with credit to the reporter unless you prefer to stay anonymous.

## Scope

In scope:

- Dashboard authentication (`APP_PASSWORD` login and sessions)
- The MCP server at `/api/mcp` and its OAuth 2.1 authorization flow
- Handling of stored Threads access tokens and synced data

Out of scope:

- Vulnerabilities in Threads or the Meta Graph API themselves
- Deployments using a weak `APP_PASSWORD` or exposing the database publicly
- Issues that require an already-compromised host or environment variables
