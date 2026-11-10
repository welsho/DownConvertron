# DownConvertron - costruisce l'installer per Windows (un solo file .bat con dentro app e icona).
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
# Uso: python3 windows/build_installer.py [cartella di uscita]   ->  dist/DownConvertron-Setup.bat
#
# Il .bat avvia PowerShell, che legge lo stesso file a partire dal marcatore #PSSTART# ed esegue:
#   1. installazione/aggiornamento dei componenti con winget (yt-dlp, ffmpeg, Deno)
#   2. copia dell'app in %LOCALAPPDATA%\Programs\DownConvertron (niente amministratore)
#   3. rimozione delle versioni precedenti (impostazioni conservate: l'app le riprende da sola)
#   4. collegamenti su Desktop e menu Start, collegamento downconvertron:// per l'estensione Chrome
# I messaggi sono in italiano, inglese o cinese in base alla lingua di Windows.
import base64, os, re, sys, textwrap
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist')
hta = open(os.path.join(ROOT, 'src', 'DownConvertron.hta'), 'rb').read()
ico = open(os.path.join(ROOT, 'src', 'DownConvertron.ico'), 'rb').read()
ver = re.search(rb'version="([\d.]+)"', hta).group(1).decode()
wrap = lambda b: "\n".join(textwrap.wrap(base64.b64encode(b).decode(), 120))

bat_head = r'''@echo off
rem DownConvertron - installer per Windows (designed by Welsho) - GPL-3.0-or-later
title DownConvertron Setup
set "DCVT_SELF=%~f0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText($env:DCVT_SELF,[Text.Encoding]::UTF8); $m='#'+'PS'+'START#'; iex $t.Substring($t.IndexOf($m)+$m.Length)"
echo.
pause
exit /b

#PSSTART#
'''
ps = r'''
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$lang = 'en'
try { $c = (Get-UICulture).TwoLetterISOLanguageName; if ($c -eq 'it' -or $c -eq 'zh') { $lang = $c } } catch {}
function M($it, $en, $zh) { if ($lang -eq 'it') { return $it } elseif ($lang -eq 'zh') { return $zh } else { return $en } }
function Say($t, $c) { if (-not $c) { $c = 'Gray' }; Write-Host $t -ForegroundColor $c }
function Step($t) { Write-Host ''; Write-Host ('  >> ' + $t) -ForegroundColor White }

Say ''
Say '  ============================================================' 'DarkRed'
Say '     DOWNCONVERTRON v__VER__  -  designed by Welsho' 'Red'
Say '  ============================================================' 'DarkRed'

$dest    = Join-Path $env:LOCALAPPDATA 'Programs\DownConvertron'
$htaPath = Join-Path $dest 'DownConvertron.hta'
$icoPath = Join-Path $dest 'DownConvertron.ico'
$unPath  = Join-Path $dest 'Uninstall.cmd'
$mshta   = Join-Path $env:SystemRoot 'System32\mshta.exe'
$ok = $true

# ------------------------------------------------------------ 1. componenti
Step (M 'Componenti: yt-dlp, ffmpeg, Deno' 'Components: yt-dlp, ffmpeg, Deno' '组件：yt-dlp、ffmpeg、Deno')
$winget = Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\winget.exe'
if (-not (Test-Path -LiteralPath $winget)) {
  Say (M '     winget non trovato: installa "Programma di installazione app" dal Microsoft Store e rilancia.' '     winget not found: install "App Installer" from the Microsoft Store and run this again.' '     未找到 winget：请从 Microsoft Store 安装“应用安装程序”后重新运行。') 'Yellow'
  $ok = $false
} else {
  $ErrorActionPreference = 'Continue'   # winget scrive su stderr anche quando va tutto bene
  foreach ($id in @('yt-dlp.yt-dlp', 'yt-dlp.FFmpeg', 'DenoLand.Deno')) {
    & $winget list --id $id -e --accept-source-agreements --disable-interactivity *> $null
    if ($LASTEXITCODE -ne 0) {
      Say ('     ' + $id + (M ': installo...' ': installing...' '：正在安装...'))
      & $winget install --id $id -e --silent --accept-source-agreements --accept-package-agreements --disable-interactivity *> $null
      if ($LASTEXITCODE -ne 0) { Say ('     ' + $id + (M ': installazione NON riuscita (codice ' ': installation FAILED (code ' '：安装失败（代码 ') + $LASTEXITCODE + ')') 'Yellow'; $ok = $false } else { Say ('     ' + $id + (M ': installato' ': installed' '：已安装')) 'Green' }
    } else {
      & $winget upgrade --id $id -e --silent --accept-source-agreements --accept-package-agreements --disable-interactivity *> $null
      Say ('     ' + $id + (M ': presente (aggiornato se serviva)' ': present (updated if needed)' '：已存在（如需要已更新）')) 'Green'
    }
  }
  $ErrorActionPreference = 'Stop'
}

# ------------------------------------------------------------ 2. app
Step ((M 'Installo l''app in ' 'Installing the app in ' '正在安装应用到 ') + $dest)
try {
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  [IO.File]::WriteAllBytes($icoPath, [Convert]::FromBase64String(($ICO_B64 -replace '\s', '')))
  $html = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($HTA_B64 -replace '\s', '')))
  # icona della finestra con percorso assoluto
  $html = $html.Replace('icon="DownConvertron.ico"', 'icon="' + $icoPath + '"')
  [IO.File]::WriteAllText($htaPath, $html, (New-Object System.Text.UTF8Encoding $false))
  $destPs = $dest.Replace("'", "''")      # apostrofo nel nome utente (es. D'Amico)
  $un = @"
@echo off
cd /d "%SystemRoot%"
title DownConvertron - Uninstall
echo DownConvertron: remove app, shortcuts and downconvertron:// link (settings in %APPDATA%\DownConvertron are kept).
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "`$p = [Environment]::GetFolderPath('Programs'); Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('Desktop')) 'DownConvertron.lnk'), (Join-Path `$p 'DownConvertron.lnk'), (Join-Path `$p 'Uninstall DownConvertron.lnk') -Force -ErrorAction SilentlyContinue; Remove-Item -LiteralPath 'HKCU:\Software\Classes\downconvertron', 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.welsho.downconvertron' -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -LiteralPath (Join-Path `$env:APPDATA 'DownConvertron\nmhost'), (Join-Path `$env:APPDATA 'DownConvertron\cookies') -Recurse -Force -ErrorAction SilentlyContinue; Start-Process -FilePath (Join-Path `$env:SystemRoot 'System32\cmd.exe') -ArgumentList '/d /c timeout /t 2 >nul & rd /s /q ""$destPs""' -WorkingDirectory `$env:SystemRoot -WindowStyle Hidden"
echo OK.
timeout /t 2 >nul
"@
  [IO.File]::WriteAllText($unPath, $un.Replace("`n", "`r`n"), [Text.Encoding]::ASCII)
  Get-ChildItem -LiteralPath $dest -File | Unblock-File -ErrorAction SilentlyContinue
  Say (M '     fatto' '     done' '     完成') 'Green'
} catch { Say ((M '     ERRORE: ' '     ERROR: ' '     错误：') + $_.Exception.Message) 'Yellow'; $ok = $false }

# ------------------------------------------------------------ 3. versioni precedenti (DownLTransFMecchazzi, Mecchazzi, Scarica Video)
#      impostazioni, preset e archivio restano in %APPDATA% e la nuova app li riprende da sola
try {
  foreach ($d in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
    foreach ($n in @('DownLTransFMecchazzi.lnk', 'Disinstalla DownLTransFMecchazzi.lnk', 'Mecchazzi.lnk', 'Disinstalla Mecchazzi.lnk', 'Scarica Video.lnk', 'Disinstalla Scarica Video.lnk')) { Remove-Item -LiteralPath (Join-Path $d $n) -Force -ErrorAction SilentlyContinue }
  }
  foreach ($o in @('Programs\DownLTransFMecchazzi', 'Programs\Mecchazzi', 'Programs\ScaricaVideo')) {
    $old = Join-Path $env:LOCALAPPDATA $o
    if (Test-Path -LiteralPath $old) { Remove-Item -LiteralPath $old -Recurse -Force -ErrorAction SilentlyContinue; Say ((M '     versione precedente rimossa: ' '     previous version removed: ' '     已移除旧版本：') + (Split-Path $o -Leaf)) 'Green' }
  }
} catch {}

# ------------------------------------------------------------ 4. collegamenti e protocollo per l'estensione Chrome
Step (M 'Collegamenti sul Desktop e nel menu Start' 'Shortcuts on the Desktop and in the Start menu' '桌面和开始菜单快捷方式')
try {
  $ws = New-Object -ComObject WScript.Shell
  $targets = @(
    @{ Dir = [Environment]::GetFolderPath('Desktop');  Name = 'DownConvertron.lnk';           Exe = $mshta;  Args = '"' + $htaPath + '"' },
    @{ Dir = [Environment]::GetFolderPath('Programs'); Name = 'DownConvertron.lnk';           Exe = $mshta;  Args = '"' + $htaPath + '"' },
    @{ Dir = [Environment]::GetFolderPath('Programs'); Name = 'Uninstall DownConvertron.lnk'; Exe = $unPath; Args = '' }
  )
  foreach ($t in $targets) {
    $l = $ws.CreateShortcut((Join-Path $t.Dir $t.Name))
    $l.TargetPath = $t.Exe; $l.Arguments = $t.Args; $l.WorkingDirectory = $dest
    $l.IconLocation = $icoPath + ',0'; $l.Description = 'DownConvertron - designed by Welsho'; $l.Save()
  }
  # downconvertron:// : il logo dell'estensione Chrome apre l'app (solo per il tuo utente)
  $k = 'HKCU:\Software\Classes\downconvertron'
  New-Item -Path $k -Force | Out-Null
  Set-ItemProperty -Path $k -Name '(default)' -Value 'URL:DownConvertron'
  Set-ItemProperty -Path $k -Name 'URL Protocol' -Value ''
  New-Item -Path ($k + '\DefaultIcon') -Force | Out-Null
  Set-ItemProperty -Path ($k + '\DefaultIcon') -Name '(default)' -Value $icoPath
  # passa dal lanciatore invisibile: se l'app e' gia' aperta la porta davanti invece di aprirne un'altra
  # (stesso file e stesso comando che registra l'app, cosi' all'avvio non li riscrive)
  $apriDir = Join-Path $env:APPDATA 'DownConvertron'
  New-Item -ItemType Directory -Force -Path $apriDir | Out-Null
  $apriPath = Join-Path $apriDir 'apri.js'
  [IO.File]::WriteAllBytes($apriPath, [Convert]::FromBase64String(($APRI_B64 -replace '\s', '')))
  New-Item -Path ($k + '\shell\open\command') -Force | Out-Null
  Set-ItemProperty -Path ($k + '\shell\open\command') -Name '(default)' -Value ('"' + (Join-Path $env:SystemRoot 'System32\wscript.exe') + '" //B //nologo "' + $apriPath + '" "' + $htaPath + '" "%1"')
  Say (M '     fatto' '     done' '     完成') 'Green'
} catch { Say ((M '     ERRORE: ' '     ERROR: ' '     错误：') + $_.Exception.Message) 'Yellow'; $ok = $false }

# ------------------------------------------------------------ fine
Write-Host ''
if ($ok) {
  Say (M '  Installazione completata. Avvio DownConvertron...' '  Installation complete. Starting DownConvertron...' '  安装完成。正在启动 DownConvertron...') 'Green'
  Say (M '  Da ora aprila dall''icona "DownConvertron" sul Desktop o nel menu Start.' '  From now on open it from the "DownConvertron" icon on the Desktop or in the Start menu.' '  以后可从桌面或开始菜单的“DownConvertron”图标打开。') 'Gray'
  Start-Process -FilePath $mshta -ArgumentList ('"' + $htaPath + '"') -WorkingDirectory $dest
} else {
  Say (M '  Installazione completata con avvisi (vedi sopra). Fai uno screenshot di questa finestra.' '  Installation completed with warnings (see above). Take a screenshot of this window.' '  安装完成但有警告（见上方）。请截图此窗口。') 'Yellow'
}
'''.replace('__VER__', ver)
apri = open(os.path.join(ROOT, 'windows', 'apri.js'), 'rb').read()
payload = "\n$HTA_B64 = @'\n" + wrap(hta) + "\n'@\n$ICO_B64 = @'\n" + wrap(ico) + "\n'@\n$APRI_B64 = @'\n" + wrap(apri) + "\n'@\n"
out = bat_head + payload + ps          # i payload sono definiti PRIMA del codice che li usa
assert out.count('#PSSTART#') == 1
os.makedirs(OUT, exist_ok=True)
dst = os.path.join(OUT, 'DownConvertron-Setup.bat')
with open(dst, 'w', encoding='utf-8', newline='\r\n') as f: f.write(out)
print(dst, len(out))
