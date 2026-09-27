# ZAF TECH Node Connector

The **ZAF TECH Node Connector** is a local Windows companion for ZAF TECH users who operate a Pi Node on their own computer.

Its purpose is simple: allow the ZAF TECH web application to read **technical, read-only status information from the user's own local Pi Node** without exposing the user's Docker daemon or Node service to the public internet.

## What it does

The Connector:

- Runs locally on the user's Windows computer.
- Listens only on `127.0.0.1`.
- Reads the local Docker state needed to identify the user's Pi Node container.
- Reads Stellar Core status from the detected Node container.
- Reports technical information such as:
  - Node/container state
  - Stellar Core build
  - Protocol version
  - Sync state
  - Current ledger information
  - Peer counts
  - SCP quorum information
  - Local port listening checks
  - Container restart count
- Provides a local health endpoint so ZAF TECH can determine whether the Connector is running.
- Supports protocol compatibility checks for Protocol 27 and Protocol 28 in Connector v0.2.0.

## What it does NOT do

The Connector is intentionally local and read-only.

It does **not**:

- Expose Docker to the internet.
- Open or configure router ports.
- Change Pi Node configuration.
- Start, stop, restart, or modify the user's Pi Node.
- Request or handle a Pi Wallet passphrase, seed phrase, or private key.
- Send Pi transactions.
- Control the user's wallet.
- Collect or upload the user's Node data to a central ZAF TECH server by itself.
- Provide remote access to the user's computer.

The Connector's local HTTP service is bound to:

`http://127.0.0.1:39100`

This address refers to the user's own computer. It is not a public internet address.

## Security model

The Connector follows a **local-first** design.

The intended data flow is:

```
User's Windows PC
    |
    +-- Pi Node / Docker
    |
    +-- ZAF TECH Node Connector
             |
             +-- 127.0.0.1:39100
                       |
                       v
                 ZAF TECH Web App
```

The Connector does not create a public network endpoint for Docker or Pi Node.

Cross-origin access is restricted to configured local development origins by default. Additional origins can only be explicitly supplied through the `ZAF_NODE_CONNECTOR_ALLOWED_ORIGINS` environment variable.

## Privacy

The Connector is designed around the principle that Node diagnostics should remain local to the user whenever possible.

The Connector itself does not contain a mechanism for sending Node diagnostics to a remote server. ZAF TECH may request the local endpoint from the user's browser when the user has the Connector installed and running.

Users should only install Connector builds obtained from a trusted ZAF TECH distribution source.

## Pi wallet safety

The Connector has no wallet functionality.

**ZAF TECH Node Connector will never ask for a Pi Wallet passphrase, seed phrase, or private key.**

Never enter a wallet passphrase or private key into the Connector or into an unofficial application claiming to be ZAF TECH.

## Compatibility

Connector v0.2.0 recognizes:

- Protocol 27 — supported
- Protocol 28 — supported

The Connector reports a compatibility status rather than assuming that every future protocol version is compatible.

If a newer protocol is detected, ZAF TECH can display a compatibility warning while the Connector is updated.

## Windows packaging

The repository contains the packaging project under:

`tools/zaf-node-connector-package/`

and a GitHub Actions workflow at:

`.github/workflows/build-node-connector.yml`

The Windows build produces:

`ZAF-TECH-Node-Connector.exe`

The current packaging target is Windows x64.

## Important security note

This README describes the intended architecture and behavior of the ZAF TECH Node Connector. It is not a formal security certification or guarantee that every future build will be free of vulnerabilities.

Before public distribution, ZAF TECH should publish Connector releases from a controlled repository/release process and provide version information and integrity verification for released installers.

## License

The licensing terms for the ZAF TECH project are defined by the project owner and may be added here before public distribution.


## Release integrity

Official GitHub Releases include a SHA-256 checksum file named `ZAF-TECH-Node-Connector-SHA256SUMS.txt`.

On Windows PowerShell, after downloading an installer, verify it with:

```powershell
Get-FileHash .\ZAF-TECH-Node-Connector-Setup.exe -Algorithm SHA256
```

Compare the resulting hash with the `ZAF-TECH-Node-Connector-Setup.exe` entry in the official checksum file. The same process can be used for the standalone executable.


## Attribution

ZAF TECH Node Connector is created and maintained by **zaffzuff** for the ZAF TECH project.
