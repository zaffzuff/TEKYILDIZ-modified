# ZAF TECH

**ZAF TECH** is an independent, read-only Pi Network ecosystem observatory and utility platform.

It brings together observable ecosystem applications, App Health checks, Mainnet data, wallet information, developer utilities, and local Pi Node infrastructure diagnostics in one interface.

## Current Product

ZAF TECH currently focuses on observable, verifiable data rather than subjective ecosystem scoring.

### Ecosystem
- Ecosystem dashboard and live observations
- Pi App Directory
- App Details
- App URL checking
- Observable application status and metadata
- Ecosystem activity signals
- Ecosystem statistics and historical trends
- Mainnet network observations

### App Health
- Live App Health checks
- Batch ecosystem health checks
- Historical App Health records
- App Health trends
- Optional PostgreSQL persistence through `DATABASE_URL`
- Scheduled health-check support

### Wallet
- Wallet overview
- Observable Pi balance information
- Locked and claimable Pi observations when available
- Recent observable wallet transactions
- Locale-aware number and date formatting

### Developer Tools
- Pi-related developer utilities
- Transaction inspection tools
- Public Mainnet data queries
- Read-only data exploration

### Node & Infrastructure
- ZAF TECH Node Connector
- Local read-only Pi Node diagnostics
- Docker and Stellar Core observations
- Node compute/resource information
- Node history and infrastructure observations
- SoloHost-related local infrastructure visibility

## Languages

The interface currently supports:

- English
- Turkish
- Spanish
- Chinese
- Italian
- French
- German
- Portuguese
- Russian

The selected language is persisted locally so it remains active while navigating the application.

## Architecture

- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL-compatible storage** for optional historical persistence
- **GitHub Actions** for build validation
- **Vercel** for deployment
- Public Pi Network/Mainnet data sources
- Local ZAF TECH Node Connector for read-only node diagnostics

## Data & Verification Principles

ZAF TECH separates observable data from claims that cannot be independently verified.

- Public network observations are presented as sampled data, not as subjective network health scores.
- Application capabilities are not treated as verified unless an observable check supports them.
- Historical and trend views describe stored observations; they are not forecasts.
- The Node Connector is designed for local, read-only diagnostics.
- Database persistence is optional. Core live checks can operate without a configured PostgreSQL database.

## Data Endpoints

The application currently exposes API routes for areas including:

- Ecosystem observations
- Ecosystem statistics
- Ecosystem change detection
- Ecosystem trends
- Historical observations
- App Health
- App Health history
- App Health trends
- App URL checks
- Wallet observations
- Developer transaction tools

## Main Routes

- `/` — ZAF TECH ecosystem dashboard
- `/ecosystem/[slug]` — application details
- `/about` — project information
- `/privacy` — privacy and data scope

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Start the production build:

```bash
npm start
```

Run the local Node Connector:

```bash
npm run node:connector
```

## Optional Database

Historical persistence uses a PostgreSQL-compatible connection supplied through:

```text
DATABASE_URL
```

Without `DATABASE_URL`, the live health-check and observation functionality can still operate, while database-backed historical storage remains unavailable.

## Node Connector

The ZAF TECH Node Connector is intentionally preserved as part of the project.

It provides a local, read-only bridge for observing Pi Node infrastructure such as Docker containers, Stellar Core status, WSL/network information, node resources, and historical node observations.

The connector is not a remote control interface and does not expose write operations for the user's local node.

## CI / Deployment

GitHub Actions validates the web application build and the Node Connector workflows.

The project is designed for deployment on Vercel.

A successful source build does not by itself guarantee that every external runtime dependency is available in production; environment variables and optional database configuration must be supplied where required.

## Independence

ZAF TECH is an independent, community-developed project. It is **not an official Pi Core Team product** and is not presented as an official Pi Network service.

## Project Status

ZAF TECH is actively evolving. Pi ecosystem integration is being developed incrementally, with the current product prioritizing a stable read-only foundation, multilingual support, observable data, App Health, wallet information, developer tools, and Node infrastructure diagnostics.

Pi Login, Pi Payments, and other authenticated/write-capability integrations are not part of the current read-only foundation.

## License

No open-source license has currently been declared for this repository. Unless a license is added, the repository remains subject to the default copyright protections applicable to its contents.
