#define MyAppName "ZAF TECH Node Connector"
#define MyAppVersion "0.4.0"
#define MyAppPublisher "ZAF TECH — zaffzuff"
#define MyAppExeName "ZAF-TECH-Node-Connector.exe"

[Setup]
AppId={{8B7F5C4D-8A2A-4D7B-9F7B-2E0B0D4C7A31}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppComments=Created by zaffzuff for ZAF TECH.
AppCopyright=Copyright © 2026 zaffzuff / ZAF TECH
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
SetupIconFile=zaf-tech-logo.ico
UninstallDisplayIcon={app}\zaf-tech-logo.ico

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "zaf-tech-logo.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "zaf-tech-logo.png"; DestDir: "{app}"; Flags: ignoreversion

[Tasks]
Name: "startup"; Description: "Start ZAF TECH Node Connector automatically with Windows"; GroupDescription: "Startup options:"; Flags: checkedonce

[Icons]
Name: "{group}\ZAF TECH Node Connector"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\zaf-tech-logo.ico"
Name: "{group}\Uninstall ZAF TECH Node Connector"; Filename: "{uninstallexe}"
Name: "{userstartup}\ZAF TECH Node Connector"; Filename: "{app}\{#MyAppExeName}"; Tasks: startup

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Start ZAF TECH Node Connector now"; Flags: nowait postinstall skipifsilent
