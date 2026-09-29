# ZAF TECH — Pi Ecosystem Intelligence

Independent, read-only technology project for exploring observable Pi Network ecosystem data, applications, Mainnet activity and local Node infrastructure.

## Product direction

ZAF TECH is being evolved from a blockchain activity dashboard into a broader Pi ecosystem utility layer:

- Pi App Directory
- App Health monitoring
- Mainnet activity intelligence
- Pi Developer Tools
- Local Pi Node diagnostics
- Node performance history
- Future Pi SDK / authentication integration
- Future API and AI ecosystem analysis

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

## v0.1.0 MVP scope

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

Pi Login, Pi Payments and AI analysis are outside the v0.1.0 scope.

## Verification boundary

ZAF TECH distinguishes observable data from unverified claims. Pi-specific application capabilities are not presented as verified unless an observable check supports the claim. Network measurements describe the sampled public Mainnet data and are not a subjective network health score.

## Main routes

- `/` — ecosystem dashboard
- `/ecosystem/[slug]` — application details
- `/about` — project information
- `/privacy` — privacy and data scope
