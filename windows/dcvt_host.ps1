# DownConvertron - ponte native messaging per l'estensione Chrome (Windows)
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
# Chrome lo avvia (tramite dcvt_host.bat) SOLO per l'estensione DownConvertron (allowed_origins nel manifest).
# Riceve il login del sito (cookie in formato Netscape) scelto con "Usa il mio login" e lo scrive in
# %APPDATA%\DownConvertron\cookies\<token>.txt: l'app lo usa solo se il sito chiede l'accesso e lo cancella a fine lavoro.
# Protocollo di Chrome: 4 byte di lunghezza (little endian) + JSON in UTF-8, in entrambe le direzioni.
# Niente deve uscire su stdout oltre alla risposta.
$ErrorActionPreference = 'Stop'
function Reply($obj) {
  $b = [Text.Encoding]::UTF8.GetBytes((ConvertTo-Json $obj -Compress))
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
  if ($msg.op -eq 'ping') { Reply @{ ok = $true; v = 1 }; exit 0 }
  if ($msg.op -ne 'cookies') { throw 'operazione sconosciuta' }
  $tok = [string]$msg.token; $data = [string]$msg.data
  if ($tok -notmatch '^[a-z0-9]{16,64}$') { throw 'token non valido' }
  if (-not $data.StartsWith('# Netscape HTTP Cookie File')) { throw 'dati non validi' }
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  # login vecchi rimasti (app chiusa di colpo): via dopo 6 ore
  Get-ChildItem -LiteralPath $dir -Filter '*.txt' -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-6) } | Remove-Item -Force -ErrorAction SilentlyContinue
  [IO.File]::WriteAllText((Join-Path $dir ($tok + '.txt')), $data, (New-Object Text.UTF8Encoding $false))
  Reply @{ ok = $true }
} catch {
  try { Reply @{ ok = $false; err = [string]$_.Exception.Message } } catch {}
  exit 1
}
