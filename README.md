# ZAF TECH — Pi Ecosystem Observatory

Independent, read-only technology project for exploring observable Pi Network ecosystem data, applications, Mainnet activity and local Node infrastructure.

## Product direction

ZAF TECH is being evolved from a blockchain activity dashboard into a broader Pi ecosystem utility layer:

- Pi App Directory
- App Health monitoring
- Historical App Health checks
- Mainnet activity observations
- Pi Developer Tools
- Local Pi Node diagnostics
- Node performance history
- Future Pi SDK / authentication integration
- Future ecosystem statistics and AI ecosystem analysis

## Architecture

- Next.js + React + TypeScript
- GitHub source control
- Vercel production hosting
- Pi Mainnet Horizon public data
- ZAF TECH Node Connector for local read-only Node diagnostics

## Independence

ZAF TECH is an independent community-developed project and is not an official Pi Core Team product.

## Node Connector

The existing ZAF TECH Node Connector remains part of this repository and is intentionally preserved. It is a local-only, read-only bridge for Docker, Stellar Core, WSL and Node resource observations.

## Development

`npm run dev`

Build:

`npm run build`

Node Connector development:

`npm run node:connector`

## Current Product Scope

The first release is intentionally read-only and utility-focused:

- Dashboard / Pi Ecosystem
- App Directory
- App Details
- App URL Checker
- Mainnet Network view
- Developer Tools
- English + Turkish
- Responsive UI
- About and Privacy pages
- GitHub Actions build validation

Pi Login, Pi Payments and AI analysis remain outside the current read-only observatory scope.

## Verification boundary

ZAF TECH distinguishes observable data from unverified claims. Pi-specific application capabilities are not presented as verified unless an observable check supports the claim. Network measurements describe the sampled public Mainnet data and are not a subjective network health score.

## Main routes

- `/` — ecosystem dashboard
- `/ecosystem/[slug]` — application details
- `/about` — project information
- `/privacy` — privacy and data scope

## Phase 3 Data foundation

The current Data phase introduces the first persistence layer for App Health observations:

- Shared server-side App Health checker
- Batch ecosystem health checks
- PostgreSQL-compatible historical storage via `DATABASE_URL`
- `zaf_app_checks` table and indexed history queries
- Historical App Health view

Historical storage is optional until a PostgreSQL-compatible `DATABASE_URL` is configured. The live health checker remains functional without a database.


### Ecosystem Change Detection
- Compares the current public ecosystem observation with the latest stored PostgreSQL snapshot when available.
- Detects observed app-count changes, ecosystem source status changes, added/removed observable signals, and DeFi status changes.
- Exposed through `/api/zaf/ecosystem/changes` and surfaced in the Observatory Activity Signals view.
- Historical comparison remains optional until `DATABASE_URL` is configured.
