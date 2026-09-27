#define MyAppName "ZAF TECH Node Connector"
#define MyAppVersion "0.2.0"
#define MyAppPublisher "ZAF TECH"
#define MyAppExeName "ZAF-TECH-Node-Connector.exe"

[Setup]
AppId={{8B7F5C4D-8A2A-4D7B-9F7B-2E0B0D4C7A31}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\ZAF TECH\Node Connector
DefaultGroupName=ZAF TECH
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\installer-dist
OutputBaseFilename=ZAF-TECH-Node-Connector-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}

[Files]
Source="..\dist\{#MyAppExeName}"; DestDir="{app}"; Flags=ignoreversion

[Tasks]
Name: "startup"; Description: "Start ZAF TECH Node Connector automatically with Windows"; GroupDescription: "Startup options:"; Flags: checkedonce

[Icons]
Name: "{group}\ZAF TECH Node Connector"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall ZAF TECH Node Connector"; Filename: "{uninstallexe}"
Name: "{userstartup}\ZAF TECH Node Connector"; Filename: "{app}\{#MyAppExeName}"; Tasks: startup

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Start ZAF TECH Node Connector now"; Flags: nowait postinstall skipifsilent
