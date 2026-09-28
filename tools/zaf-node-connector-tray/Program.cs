using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Win32;
using System.Windows.Forms;

namespace ZafTechNodeConnectorTray;

internal static class Program
{
    private const string Version = "1.6.2";
    private const string RunKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string RunValueName = "ZAF-TECH Pi Node Connector";
    private const string ConnectorUrl = "http://127.0.0.1:39100";
    private const string WebsiteUrl = "https://zaf-tech.vercel.app";

    [STAThread]
    private static void Main()
    {
        using var mutex = new Mutex(true, "ZAF-TECH-Node-Connector-Tray", out var createdNew);
        if (!createdNew)
        {
            return;
        }

        ApplicationConfiguration.Initialize();
        Application.Run(new TrayContext());
    }

    private sealed class TrayContext : ApplicationContext
    {
        private readonly NotifyIcon _tray;
        private readonly ContextMenuStrip _menu;
        private readonly ToolStripMenuItem _connectorStatus;
        private readonly ToolStripMenuItem _nodeStatus;
        private readonly ToolStripMenuItem _startConnector;
        private readonly ToolStripMenuItem _stopConnector;
        private readonly ToolStripMenuItem _refresh;
        private readonly ToolStripMenuItem _startWithWindows;
        private readonly System.Windows.Forms.Timer _timer;
        private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(4) };
        private Process? _worker;
        private bool _refreshing;
        private bool _closing;

        public TrayContext()
        {
            _connectorStatus = new ToolStripMenuItem("● Connector: kontrol ediliyor…") { Enabled = false };
            _nodeStatus = new ToolStripMenuItem("● Node: kontrol ediliyor…") { Enabled = false };

            _startConnector = new ToolStripMenuItem("Connector'ı Başlat");
            _startConnector.Click += (_, _) =>
            {
                StartWorker();
                _ = RefreshStatusAsync();
            };

            _stopConnector = new ToolStripMenuItem("Connector'ı Durdur");
            _stopConnector.Click += (_, _) =>
            {
                StopWorker();
                _ = RefreshStatusAsync();
            };

            _refresh = new ToolStripMenuItem("Durumu Yenile");
            _refresh.Click += (_, _) => _ = RefreshStatusAsync();

            var openWebsite = new ToolStripMenuItem("ZAF TECH'i Aç");
            openWebsite.Click += (_, _) => OpenUrl(WebsiteUrl);

            _startWithWindows = new ToolStripMenuItem("Windows ile Başlat")
            {
                CheckOnClick = true,
                Checked = IsStartWithWindowsEnabled()
            };
            _startWithWindows.CheckedChanged += (_, _) => SetStartWithWindows(_startWithWindows.Checked);

            var about = new ToolStripMenuItem($"ZAF-TECH Pi Node Connector v{Version}");
            about.Enabled = false;

            var exit = new ToolStripMenuItem("Çıkış");
            exit.Click += (_, _) => ExitApplication();

            _menu = new ContextMenuStrip();
            _menu.Items.Add(_connectorStatus);
            _menu.Items.Add(_nodeStatus);
            _menu.Items.Add(new ToolStripSeparator());
            _menu.Items.Add(_startConnector);
            _menu.Items.Add(_stopConnector);
            _menu.Items.Add(_refresh);
            _menu.Items.Add(openWebsite);
            _menu.Items.Add(_startWithWindows);
            _menu.Items.Add(new ToolStripSeparator());
            _menu.Items.Add(about);
            _menu.Items.Add(exit);

            var iconPath = Path.Combine(AppContext.BaseDirectory, "zaf-tech-logo.ico");
            _tray = new NotifyIcon
            {
                Icon = File.Exists(iconPath) ? new Icon(iconPath) : SystemIcons.Application,
                Visible = true,
                Text = "ZAF-TECH Pi Node Connector",
                ContextMenuStrip = _menu
            };
            _tray.DoubleClick += (_, _) => OpenUrl(WebsiteUrl);

            _timer = new System.Windows.Forms.Timer { Interval = 15000 };
            _timer.Tick += async (_, _) => await RefreshStatusAsync();
            _timer.Start();

            StartWorker();
            _ = RefreshStatusAsync();
        }

        private void StartWorker()
        {
            if (_worker is { HasExited: false })
            {
                return;
            }

            var workerPath = Path.Combine(AppContext.BaseDirectory, "ZAF-TECH-Node-Connector-Worker.exe");
            if (!File.Exists(workerPath))
            {
                MessageBox.Show(
                    "ZAF-TECH Pi Node Connector Worker bulunamadı. Kurulumu onarın veya Connector'ı yeniden kurun.",
                    "ZAF-TECH Pi Node Connector",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
                return;
            }

            try
            {
                _worker?.Dispose();
                _worker = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = workerPath,
                        WorkingDirectory = AppContext.BaseDirectory,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    },
                    EnableRaisingEvents = true
                };

                _worker.Exited += (_, _) =>
                {
                    if (!_closing)
                    {
                        _ = RefreshStatusAsync();
                    }
                };

                _worker.Start();
                var process = _worker;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await process.StandardOutput.ReadToEndAsync();
                    }
                    catch { }
                });

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await process.StandardError.ReadToEndAsync();
                    }
                    catch { }
                });
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    $"Connector başlatılamadı:\n\n{error.Message}",
                    "ZAF-TECH Pi Node Connector",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void StopWorker()
        {
            try
            {
                if (_worker is { HasExited: false })
                {
                    _worker.Kill(entireProcessTree: true);
                    _worker.WaitForExit(2500);
                }
            }
            catch
            {
                // The worker may already have exited.
            }
            finally
            {
                _worker?.Dispose();
                _worker = null;
            }
        }

        private async Task RefreshStatusAsync()
        {
            if (_refreshing || _closing)
            {
                return;
            }

            _refreshing = true;
            try
            {
                var workerRunning = _worker is { HasExited: false };

                if (!workerRunning)
                {
                    _connectorStatus.Text = "● Connector: Durduruldu";
                    _connectorStatus.ForeColor = Color.DarkRed;
                    _nodeStatus.Text = "● Node: bağlantı yok";
                    _nodeStatus.ForeColor = Color.DimGray;
                    _startConnector.Enabled = true;
                    _stopConnector.Enabled = false;
                    _tray.Text = "ZAF-TECH Pi Node Connector — Durduruldu";
                    return;
                }

                using var healthResponse = await _http.GetAsync($"{ConnectorUrl}/health");
                if (!healthResponse.IsSuccessStatusCode)
                {
                    throw new HttpRequestException();
                }

                _connectorStatus.Text = "● Connector: Çalışıyor";
                _connectorStatus.ForeColor = Color.DarkGreen;
                _startConnector.Enabled = false;
                _stopConnector.Enabled = true;

                using var nodeResponse = await _http.GetAsync($"{ConnectorUrl}/node");
                if (!nodeResponse.IsSuccessStatusCode)
                {
                    _nodeStatus.Text = "● Node: okunamıyor";
                    _nodeStatus.ForeColor = Color.DarkOrange;
                    _tray.Text = "ZAF-TECH Pi Node Connector — Node okunamıyor";
                    return;
                }

                await using var stream = await nodeResponse.Content.ReadAsStreamAsync();
                using var document = await JsonDocument.ParseAsync(stream);

                if (!document.RootElement.TryGetProperty("node", out var node) || node.ValueKind == JsonValueKind.Null)
                {
                    _nodeStatus.Text = "● Node: bulunamadı";
                    _nodeStatus.ForeColor = Color.DarkOrange;
                    _tray.Text = "ZAF-TECH Pi Node Connector — Node bulunamadı";
                    return;
                }

                var state = node.TryGetProperty("state", out var stateElement) ? stateElement.GetString() : null;
                var sync = node.TryGetProperty("sync", out var syncElement) ? syncElement.GetString() : null;
                var ledgerAge = node.TryGetProperty("ledger", out var ledger)
                    && ledger.TryGetProperty("age", out var ageElement)
                    && ageElement.ValueKind == JsonValueKind.Number
                    ? ageElement.GetInt32()
                    : -1;
                var authenticated = node.TryGetProperty("peers", out var peers)
                    && peers.TryGetProperty("authenticated", out var authElement)
                    && authElement.ValueKind == JsonValueKind.Number
                    ? authElement.GetInt32()
                    : -1;

                var synced = string.Equals(sync, "synced!", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(sync, "synced", StringComparison.OrdinalIgnoreCase);
                var healthy = string.Equals(state, "running", StringComparison.OrdinalIgnoreCase)
                    && synced
                    && ledgerAge >= 0
                    && ledgerAge < 10
                    && authenticated >= 8;

                if (healthy)
                {
                    _nodeStatus.Text = $"● Node: Sağlıklı — {ledgerAge}s — {authenticated} peer";
                    _nodeStatus.ForeColor = Color.DarkGreen;
                    _tray.Text = $"ZAF-TECH Pi Node Connector — Node sağlıklı ({ledgerAge}s)";
                }
                else if (string.Equals(state, "running", StringComparison.OrdinalIgnoreCase))
                {
                    _nodeStatus.Text = $"● Node: Çalışıyor — {sync ?? "unknown"}";
                    _nodeStatus.ForeColor = Color.DarkOrange;
                    _tray.Text = "ZAF-TECH Pi Node Connector — Node çalışıyor";
                }
                else
                {
                    _nodeStatus.Text = $"● Node: {state ?? "bilinmiyor"}";
                    _nodeStatus.ForeColor = Color.DarkRed;
                    _tray.Text = "ZAF-TECH Pi Node Connector — Node durumu sorunlu";
                }
            }
            catch
            {
                _connectorStatus.Text = "● Connector: başlatılıyor / erişilemiyor";
                _connectorStatus.ForeColor = Color.DarkOrange;
                _nodeStatus.Text = "● Node: bekleniyor";
                _nodeStatus.ForeColor = Color.DimGray;
                _startConnector.Enabled = false;
                _stopConnector.Enabled = _worker is { HasExited: false };
                _tray.Text = "ZAF-TECH Pi Node Connector — Bağlantı bekleniyor";
            }
            finally
            {
                _refreshing = false;
            }
        }

        private static void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch { }
        }

        private static bool IsStartWithWindowsEnabled()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: false);
                return key?.GetValue(RunValueName) is string value
                    && value.Contains("ZAF-TECH-Node-Connector.exe", StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private static void SetStartWithWindows(bool enabled)
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: true)
                    ?? Registry.CurrentUser.CreateSubKey(RunKeyPath);

                if (enabled)
                {
                    var exe = Environment.ProcessPath ?? Path.Combine(AppContext.BaseDirectory, "ZAF-TECH-Node-Connector.exe");
                    key.SetValue(RunValueName, $"\"{exe}\"");
                }
                else
                {
                    key.DeleteValue(RunValueName, throwOnMissingValue: false);
                }
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    $"Windows başlangıç ayarı değiştirilemedi:\n\n{error.Message}",
                    "ZAF-TECH Pi Node Connector",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
            }
        }

        private void ExitApplication()
        {
            _closing = true;
            _timer.Stop();
            StopWorker();
            _tray.Visible = false;
            _tray.Dispose();
            _menu.Dispose();
            _http.Dispose();
            Application.Exit();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _closing = true;
                _timer.Stop();
                StopWorker();
                _tray.Visible = false;
                _tray.Dispose();
                _menu.Dispose();
                _http.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
