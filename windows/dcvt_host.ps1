# DownConvertron - ponte native messaging per l'estensione Chrome (Windows)
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
# Chrome lo avvia (tramite dcvt_host.bat) SOLO per l'estensione DownConvertron (allowed_origins nel manifest).
# Riceve il login del sito (cookie in formato Netscape) scelto con "Usa il mio login" e lo scrive in
# %APPDATA%\DownConvertron\cookies\<token>.txt: l'app lo usa solo se il sito chiede l'accesso e lo cancella a fine lavoro.
# Protocollo di Chrome: 4 byte di lunghezza (little endian) + JSON in UTF-8, in entrambe le direzioni.
# Niente deve uscire su stdout oltre alla risposta.
$ErrorActionPreference = 'Stop'
function Reply($obj) {
  $b = [Text.Encoding]::UTF8.GetBytes((ConvertTo-Json $obj -Compress -Depth 5))
  $out = [Console]::OpenStandardOutput()
  $out.Write([BitConverter]::GetBytes([int]$b.Length), 0, 4); $out.Write($b, 0, $b.Length); $out.Flush()
}
function ReadExact($s, $n) {
  $buf = New-Object byte[] $n; $got = 0
  while ($got -lt $n) { $r = $s.Read($buf, $got, $n - $got); if ($r -le 0) { break }; $got += $r }
  if ($got -ne $n) { throw 'messaggio incompleto' }
  return ,$buf
}
try {
  $in = [Console]::OpenStandardInput()
  $len = [BitConverter]::ToInt32((ReadExact $in 4), 0)
  if ($len -le 0 -or $len -gt 1572864) { throw 'messaggio troppo grande' }
  $msg = [Text.Encoding]::UTF8.GetString((ReadExact $in $len)) | ConvertFrom-Json
  $dir = Join-Path $env:APPDATA 'DownConvertron\cookies'
  # login rimasti su disco senza nessuno che li usi, a ogni chiamata (anche la semplice apertura del popup):
  # l'app, finche' ne ha in uso, aggiorna cookies\in_uso ogni minuto. Se quel file manca o e' fermo da 5 minuti
  # l'app e' chiusa o non li usa piu': via i login piu' vecchi di 10 minuti. In ogni caso, via dopo 6 ore.
  try {
    if (Test-Path -LiteralPath $dir) {
      $viva = Join-Path $dir 'in_uso'; $lim = (Get-Date).AddHours(-6)
      if (-not ((Test-Path -LiteralPath $viva) -and (Get-Item -LiteralPath $viva).LastWriteTime -gt (Get-Date).AddMinutes(-5))) { $lim = (Get-Date).AddMinutes(-10) }
      Get-ChildItem -LiteralPath $dir -Filter '*.txt' -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $lim } | Remove-Item -Force -ErrorAction SilentlyContinue
    }
  } catch {}
  if ($msg.op -eq 'ping') { Reply @{ ok = $true; v = 2 }; exit 0 }
  # link che hanno chiesto l'accesso (li scrive l'app a fine lavoro): l'estensione mostra "Riprova con il mio login"
  if ($msg.op -eq 'richieste') {
    $f = Join-Path $env:APPDATA 'DownConvertron\login_richiesto.txt'; $l = New-Object System.Collections.ArrayList
    if ((Test-Path -LiteralPath $f) -and (Get-Item -LiteralPath $f).LastWriteTime -gt (Get-Date).AddHours(-24)) {
      foreach ($r in [IO.File]::ReadAllLines($f, (New-Object Text.UTF8Encoding $false))) {
        $p = $r.Split([char]9)
        if ($p.Length -ge 2 -and $p[1] -match '^https?://') { $n = ''; if ($p.Length -ge 3) { $n = $p[2] }; [void]$l.Add(@{ t = $p[0]; url = $p[1]; nome = $n }) }
        if ($l.Count -ge 50) { break }
      }
    }
    Reply @{ ok = $true; links = @($l) }; exit 0
  }
  # logo e invio dell'estensione: avvia l'app o la porta in primo piano (senza passare da downconvertron://,
  # che Chrome blocca se tra il clic e l'apertura passa troppo tempo e che non puo' portare l'app davanti)
  if ($msg.op -eq 'open') {
    $link = [string]$msg.url
    if ($link -notmatch '^downconvertron://[A-Za-z0-9_./?=&%-]*$') { $link = 'downconvertron://open' }
    $app = Get-CimInstance Win32_Process -Filter "Name = 'mshta.exe'" -ErrorAction SilentlyContinue |
      Where-Object { [string]$_.CommandLine -match '[\\/"]DownConvertron[^\\/"]*\.hta' } | Select-Object -First 1
    $how = 'front'; $wait = 2
    if ($app) { $appId = $app.ProcessId }
    else {
      # percorso dell'app: lo scrive DownConvertron a ogni avvio (app.txt accanto a questo script)
      $hta = ''; $cfg = Join-Path $PSScriptRoot 'app.txt'
      if (Test-Path -LiteralPath $cfg) { $hta = ([IO.File]::ReadAllText($cfg, (New-Object Text.UTF8Encoding $false))).Trim() }
      if (-not $hta -or -not (Test-Path -LiteralPath $hta)) { throw 'app non trovata' }
      # avvio con WMI: il processo nasce fuori dal gruppo di processi del ponte, che Chrome chiude a fine messaggio
      $cmd = '"' + (Join-Path $env:SystemRoot 'System32\mshta.exe') + '" "' + $hta + '" "' + $link + '"'
      $r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd }
      if ($r.ReturnValue -ne 0) { throw ('avvio non riuscito (' + $r.ReturnValue + ')') }
      $appId = $r.ProcessId; $how = 'start'; $wait = 20
    }
    $win = [IntPtr]::Zero; $end = (Get-Date).AddSeconds($wait)
    do {
      $pr = Get-Process -Id $appId -ErrorAction SilentlyContinue
      if ($pr -and $pr.MainWindowHandle -ne [IntPtr]::Zero) { $win = $pr.MainWindowHandle; break }
      Start-Sleep -Milliseconds 200
    } while ((Get-Date) -lt $end)
    $front = $false
    if ($win -ne [IntPtr]::Zero) {
      $u = Add-Type -Name W -Namespace DCVT -PassThru -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
[DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int c);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
'@
      if ($u::IsIconic($win)) { [void]$u::ShowWindowAsync($win, 9) }
      # Windows non lascia cambiare il primo piano a un programma in secondo piano, ma lo permette con Alt premuto:
      # Alt giu', primo piano, Alt su (il rilascio arriva gia' all'app, quindi Chrome non apre il suo menu)
      for ($k = 0; $k -lt 3 -and -not $front; $k++) {
        $u::keybd_event(0x12, 0, 0, [UIntPtr]::Zero)
        [void]$u::SetForegroundWindow($win)
        $u::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
        [void]$u::BringWindowToTop($win)
        Start-Sleep -Milliseconds 150
        $front = ($u::GetForegroundWindow() -eq $win)
      }
    }
    Reply @{ ok = $true; how = $how; front = $front }; exit 0
  }
  if ($msg.op -ne 'cookies') { throw 'operazione sconosciuta' }
  $tok = [string]$msg.token; $data = [string]$msg.data
  # solo minuscole e cifre, senza a-capo finale (-cnotmatch distingue le maiuscole, \z non accetta l'a-capo)
  if ($tok -cnotmatch '\A[a-z0-9]{16,64}\z') { throw 'token non valido' }
  if (-not $data.StartsWith('# Netscape HTTP Cookie File')) { throw 'dati non validi' }
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [IO.File]::WriteAllText((Join-Path $dir ($tok + '.txt')), $data, (New-Object Text.UTF8Encoding $false))
  Reply @{ ok = $true }
} catch {
  try { Reply @{ ok = $false; err = [string]$_.Exception.Message } } catch {}
  exit 1
}
