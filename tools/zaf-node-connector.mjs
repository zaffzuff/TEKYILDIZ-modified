import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { Socket } from "node:net";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

const HOST = "127.0.0.1";
const VERSION = "0.3.0";
const SUPPORTED_PROTOCOLS = new Set([27, 28]);
const PORT = Number(process.env.ZAF_NODE_CONNECTOR_PORT || 39100);
const HISTORY_INTERVAL_MS = 60_000;
const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const HISTORY_DIR = path.join(process.env.APPDATA || process.env.LOCALAPPDATA || process.cwd(), "ZAF TECH", "Node Connector");
const HISTORY_FILE = path.join(HISTORY_DIR, "node-history.json");
const ALLOWED_ORIGINS = new Set(
  [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://zaf-tech.vercel.app",
    ...(process.env.ZAF_NODE_CONNECTOR_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ]
);

function json(res, status, payload, origin) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "http://localhost:3000",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(payload));
}

async function docker(args) {
  try {
    const { stdout } = await execFileAsync("docker", args, {
      windowsHide: true,
      timeout: 8000,
      maxBuffer: 2 * 1024 * 1024,
    });
    return { ok: true, stdout: stdout.trim() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stdout: "",
    };
  }
}

function parseProtocol(image) {
  const match = image.match(/(?:^|[-_:])p(\d+(?:\.\d+)?)(?:$|[-_:])/i);
  return match ? `v${match[1]}` : null;
}

function portCheck(port, timeoutMs = 700) {
  return new Promise((resolve) => {
    const socket = new Socket();
    let settled = false;
    const finish = (open) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, HOST);
  });
}

function inferSync(logs) {
  const text = logs.toLowerCase();
  if (/protocol synced!?|synced!/.test(text)) return "synced";
  if (/catching up|catchup/.test(text)) return "catching_up";
  if (/joining scp/.test(text)) return "joining_scp";
  if (/error|fatal|panic/.test(text)) return "error";
  return "unknown";
}

async function readCorePeers(containerId) {
  const result = await docker([
    "exec",
    containerId,
    "sh",
    "-lc",
    "stellar-core http-command peers 2>/dev/null",
  ]);

  if (!result.ok) return null;

  const start = result.stdout.indexOf("{");
  if (start < 0) return null;

  try {
    const parsed = JSON.parse(result.stdout.slice(start));
    return parsed?.peers ?? parsed;
  } catch {
    return null;
  }
}

async function readCoreInfo(containerId) {
  const result = await docker([
    "exec",
    containerId,
    "sh",
    "-lc",
    "stellar-core http-command info 2>/dev/null",
  ]);

  if (!result.ok) return null;

  const start = result.stdout.indexOf("{");
  if (start < 0) return null;

  try {
    const parsed = JSON.parse(result.stdout.slice(start));
    return parsed?.info ?? parsed;
  } catch {
    return null;
  }
}

async function readNode() {
  const list = await docker([
    "ps",
    "-a",
    "--format",
    "{{json .}}",
  ]);

  if (!list.ok) {
    return {
      connector: { connected: true, version: VERSION, docker: false },
      node: null,
      ports: [],
      error: "Docker CLI is not available or the Docker daemon cannot be reached.",
    };
  }

  const containers = list.stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const candidates = containers.filter((container) => {
    const name = String(container.Names || "").toLowerCase();
    const image = String(container.Image || "").toLowerCase();
    return (
      name.includes("testnet2") ||
      name.includes("pi-consensus") ||
      image.includes("pi-node-docker") ||
      image.includes("pi-consensus")
    );
  });

  const candidate = candidates.find((item) => String(item.State).toLowerCase() === "running") || candidates[0];

  const ports = await Promise.all(
    Array.from({ length: 10 }, (_, index) => 31400 + index).map(async (port) => ({
      port,
      listeningLocally: await portCheck(port),
    }))
  );

  if (!candidate) {
    return {
      connector: { connected: true, version: VERSION, docker: true },
      node: null,
      ports,
      candidates: [],
      observedAt: new Date().toISOString(),
    };
  }

  const inspect = await docker(["inspect", candidate.ID || candidate.Names]);
  let detail = null;
  if (inspect.ok) {
    try {
      detail = JSON.parse(inspect.stdout)[0];
    } catch {
      detail = null;
    }
  }

  const logsResult = await docker(["logs", "--tail", "120", candidate.ID || candidate.Names]);
  const logs = logsResult.ok ? logsResult.stdout : "";

  const image = String(candidate.Image || detail?.Config?.Image || "");
  const startedAt = detail?.State?.StartedAt || null;
  const running = Boolean(detail?.State?.Running);
  const [coreInfo, corePeers] = running
    ? await Promise.all([
        readCoreInfo(candidate.ID || candidate.Names),
        readCorePeers(candidate.ID || candidate.Names),
      ])
    : [null, null];

  return {
    connector: { connected: true, docker: true, core: Boolean(coreInfo) },
    node: {
      containerName: String(candidate.Names || "").replace(/^\//, ""),
      containerId: String(candidate.ID || "").slice(0, 12),
      state: running ? "running" : String(detail?.State?.Status || candidate.State || "unknown"),
      image,
      protocol: coreInfo?.protocol_version ?? coreInfo?.ledger?.version ?? parseProtocol(image),
      protocolSupport: (() => {
        const protocol = Number(coreInfo?.protocol_version ?? coreInfo?.ledger?.version ?? parseProtocol(image));
        if (!Number.isFinite(protocol)) return "unknown";
        return SUPPORTED_PROTOCOLS.has(protocol) ? "supported" : "newer_or_unsupported";
      })(),
      sync: coreInfo?.state ? String(coreInfo.state).toLowerCase() : inferSync(logs),
      coreBuild: coreInfo?.build ?? null,
      network: coreInfo?.network ?? null,
      compatibility: {
        supportedProtocols: [...SUPPORTED_PROTOCOLS],
        status: (() => {
          const protocol = Number(coreInfo?.protocol_version ?? coreInfo?.ledger?.version ?? parseProtocol(image));
          if (!Number.isFinite(protocol)) return "unknown";
          return SUPPORTED_PROTOCOLS.has(protocol) ? "supported" : "newer_or_unsupported";
        })(),
      },
      ledger: coreInfo?.ledger ? {
        number: Number(coreInfo.ledger.num ?? 0) || null,
        age: Number(coreInfo.ledger.age ?? 0) || null,
        hash: coreInfo.ledger.hash ?? null,
        version: Number(coreInfo.ledger.version ?? 0) || null,
      } : null,
      peers: coreInfo?.peers ? {
        authenticated: Number(coreInfo.peers.authenticated_count ?? coreInfo.peers.authenticated ?? 0),
        pending: Number(coreInfo.peers.pending_count ?? coreInfo.peers.pending ?? 0),
        inbound: corePeers?.authenticated_peers?.inbound ? corePeers.authenticated_peers.inbound.length : null,
        outbound: corePeers?.authenticated_peers?.outbound ? corePeers.authenticated_peers.outbound.length : null,
        pendingInbound: corePeers?.pending_peers?.inbound ? corePeers.pending_peers.inbound.length : null,
        pendingOutbound: corePeers?.pending_peers?.outbound ? corePeers.pending_peers.outbound.length : null,
      } : null,
      quorum: coreInfo?.quorum ? {
        node: coreInfo.quorum.node ?? null,
        phase: coreInfo.quorum.qset?.phase ?? coreInfo.quorum.phase ?? null,
        agree: Number(coreInfo.quorum.qset?.agree ?? coreInfo.quorum.agree ?? 0),
        disagree: Number(coreInfo.quorum.qset?.disagree ?? coreInfo.quorum.disagree ?? 0),
        missing: Number(coreInfo.quorum.qset?.missing ?? coreInfo.quorum.missing ?? 0),
        lagMs: Number(coreInfo.quorum.qset?.lag_ms ?? coreInfo.quorum.qset?.lagMs ?? coreInfo.quorum.lag_ms ?? coreInfo.quorum.lagMs ?? 0),
        intersection: coreInfo.quorum.transitive?.intersection ?? coreInfo.quorum.qset?.intersection ?? coreInfo.quorum.intersection ?? null,
        nodeCount: Number(coreInfo.quorum.transitive?.node_count ?? coreInfo.quorum.qset?.nodeCount ?? coreInfo.quorum.nodeCount ?? 0) || null,
      } : null,
      startedAt,
      restartCount: Number(detail?.RestartCount ?? 0),
      health: detail?.State?.Health?.Status || null,
      publishedPorts: String(candidate.Ports || ""),
    },
    ports,
    candidates: candidates.map((item) => ({
      name: String(item.Names || "").replace(/^\//, ""),
      state: String(item.State || ""),
      image: String(item.Image || ""),
    })),
    observedAt: new Date().toISOString(),
  };
}


function historySample(snapshot) {
  const node = snapshot?.node;
  const peers = node?.peers;
  const quorum = node?.quorum;
  const synced = String(node?.sync || "").toLowerCase() === "synced!";
  const ledgerAge = node?.ledger?.age ?? null;
  const available = Boolean(snapshot?.connector?.docker && snapshot?.connector?.core && node?.state === "running");
  const healthy = Boolean(
    available &&
    synced &&
    ledgerAge != null &&
    ledgerAge < 10 &&
    (peers?.authenticated ?? 0) >= 8 &&
    String(quorum?.phase || "").toUpperCase() === "EXTERNALIZE" &&
    quorum?.intersection !== false
  );
  return {
    observedAt: snapshot?.observedAt || new Date().toISOString(),
    available,
    healthy,
    sync: node?.sync ?? "unknown",
    ledgerAge,
    ledgerNumber: node?.ledger?.number ?? null,
    authenticated: peers?.authenticated ?? null,
    inbound: peers?.inbound ?? null,
    outbound: peers?.outbound ?? null,
    pending: peers?.pending ?? null,
    quorumPhase: quorum?.phase ?? null,
    quorumLagMs: quorum?.lagMs ?? null,
    intersection: quorum?.intersection ?? null,
    restarts: node?.restartCount ?? null,
    listeningPorts: Array.isArray(snapshot?.ports) ? snapshot.ports.filter((item) => item.listeningLocally).length : null,
  };
}

let history = [];
let historyWriteInFlight = Promise.resolve();

async function loadHistory() {
  try {
    const raw = await readFile(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    history = Array.isArray(parsed) ? parsed : [];
  } catch {
    history = [];
  }
  pruneHistory();
}

function pruneHistory() {
  const cutoff = Date.now() - HISTORY_WINDOW_MS;
  history = history.filter((item) => {
    const time = Date.parse(item.observedAt);
    return Number.isFinite(time) && time >= cutoff;
  });
}

function saveHistory() {
  historyWriteInFlight = historyWriteInFlight.then(async () => {
    await mkdir(HISTORY_DIR, { recursive: true });
    const tempFile = `${HISTORY_FILE}.tmp`;
    await writeFile(tempFile, JSON.stringify(history), "utf8");
    await rename(tempFile, HISTORY_FILE);
  }).catch(() => undefined);
  return historyWriteInFlight;
}

async function recordHistory(snapshot) {
  history.push(historySample(snapshot));
  pruneHistory();
  await saveHistory();
}

function historySummary() {
  const now = Date.now();
  const windows = [24, 24 * 7, 24 * 30];
  const summary = {};
  for (const hours of windows) {
    const cutoff = now - hours * 60 * 60 * 1000;
    const samples = history.filter((item) => Date.parse(item.observedAt) >= cutoff);
    const available = samples.filter((item) => item.available);
    const healthy = samples.filter((item) => item.healthy);
    const avg = (key) => {
      const values = available.map((item) => item[key]).filter((value) => typeof value === "number" && Number.isFinite(value));
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    };
    summary[String(hours)] = {
      samples: samples.length,
      availability: samples.length ? (available.length / samples.length) * 100 : null,
      health: samples.length ? (healthy.length / samples.length) * 100 : null,
      avgInbound: avg("inbound"),
      avgOutbound: avg("outbound"),
      maxInbound: available.reduce((max, item) => Math.max(max, item.inbound ?? 0), 0),
      maxOutbound: available.reduce((max, item) => Math.max(max, item.outbound ?? 0), 0),
    };
  }
  return summary;
}

async function recordHistorySample() {
  try {
    await recordHistory(await readNode());
  } catch {
    await recordHistory({ connector: { docker: false, core: false }, node: null, ports: [], observedAt: new Date().toISOString() });
  }
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": ALLOWED_ORIGINS.has(origin) ? origin : "http://localhost:3000",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "600",
    });
    res.end();
    return;
  }

  if (req.method !== "GET" || !["/health", "/node", "/history"].includes(req.url)) {
    json(res, 404, { error: "Not found" }, origin);
    return;
  }

  if (req.url === "/health") {
    json(res, 200, {
      connector: "zaf-node-connector",
      version: VERSION,
      supportedProtocols: [...SUPPORTED_PROTOCOLS],
      ok: true,
      host: HOST,
      port: PORT,
      history: { endpoint: "/history", windowDays: 30, sampleIntervalSeconds: 60 },
      observedAt: new Date().toISOString(),
    }, origin);
    return;
  }

  if (req.url === "/history") {
    json(res, 200, {
      connector: "zaf-node-connector",
      version: VERSION,
      windowDays: 30,
      sampleIntervalSeconds: 60,
      samples: history,
      summary: historySummary(),
      observedAt: new Date().toISOString(),
    }, origin);
    return;
  }

  try {
    const snapshot = await readNode();
    json(res, 200, snapshot, origin);
    void recordHistory(snapshot);
  } catch (error) {
    json(
      res,
      500,
      {
        connector: { connected: true, version: VERSION, docker: false },
        error: error instanceof Error ? error.message : String(error),
      },
      origin
    );
  }
});

await loadHistory();
void recordHistorySample();
setInterval(() => void recordHistorySample(), HISTORY_INTERVAL_MS);

server.listen(PORT, HOST, () => {
  console.log(`ZAF TECH Node Connector v${VERSION} listening on http://${HOST}:${PORT}/node`);
  console.log(`History endpoint: http://${HOST}:${PORT}/history`);\n  console.log(`Health endpoint: http://${HOST}:${PORT}/health`);
  console.log("Local-only connector. It does not expose Docker outside this computer.");
  console.log("Built by zaffzuff for ZAF TECH.");
});
