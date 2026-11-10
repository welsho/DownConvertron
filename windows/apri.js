/* DownConvertron - lanciatore del collegamento downconvertron:// (logo e invio dell'estensione Chrome).
   Se l'app e' gia' aperta la porta in primo piano: i link li legge da sola dagli appunti.
   Altrimenti la avvia. Gira con wscript //B: nessuna finestra.
   Argomenti: percorso dell'HTA, link downconvertron://
   Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later */
var sh = new ActiveXObject("WScript.Shell"), A = WScript.Arguments;
var hta = A.length > 0 ? A(0) : "", url = A.length > 1 ? A(1) : "";

/* processo di DownConvertron gia' aperto (mshta a 32 o 64 bit, installata o no): 0 se non c'e' */
function running() {
  try {
    var wmi = GetObject("winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\cimv2");
    var e = new Enumerator(wmi.ExecQuery("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'mshta.exe'"));
    for (; !e.atEnd(); e.moveNext()) {
      var cl = String(e.item().CommandLine || "");
      if (/[\\\/"]DownConvertron[^\\\/"]*\.hta/i.test(cl)) return e.item().ProcessId;
    }
  } catch (x) {}
  return 0;
}
/* lo stesso mshta del doppio clic sui file .hta, cosi' "una sola istanza" vale anche dopo */
function mshta() {
  var def = sh.ExpandEnvironmentStrings("%SystemRoot%") + "\\System32\\mshta.exe", c = "", m;
  try { c = String(sh.RegRead("HKCR\\htafile\\shell\\open\\command\\")); } catch (x) {}
  m = /^\s*"([^"]*mshta\.exe)"/i.exec(c) || /^\s*(\S*mshta\.exe)/i.exec(c);
  return m ? sh.ExpandEnvironmentStrings(m[1]) : def;
}

/* base64 di una stringa in UTF-16LE (per powershell -EncodedCommand: niente problemi di virgolette) */
function b64u16(s) {
  var K = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", b = [], o = "", i, n;
  for (i = 0; i < s.length; i++) { n = s.charCodeAt(i); b.push(n & 255, n >> 8); }
  for (i = 0; i < b.length; i += 3) {
    n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0);
    o += K.charAt(n >> 18 & 63) + K.charAt(n >> 12 & 63) + (i + 1 < b.length ? K.charAt(n >> 6 & 63) : "=") + (i + 2 < b.length ? K.charAt(n & 63) : "=");
  }
  return o;
}
/* AppActivate non ripristina una finestra ridotta a icona (lo fa ShowWindowAsync) e Windows spesso gli nega il primo
   piano: SetForegroundWindow con Alt premuto (PowerShell nascosto) lo ottiene */
function restore(pid) {
  var ps = sh.ExpandEnvironmentStrings("%SystemRoot%") + "\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
  var code = "$h = (Get-Process -Id " + pid + ").MainWindowHandle; if ($h -ne 0) { " +
    "$w = Add-Type -Name W -Namespace DCVT -PassThru -MemberDefinition '[DllImport(\"user32.dll\")] public static extern bool IsIconic(IntPtr h); [DllImport(\"user32.dll\")] public static extern bool ShowWindowAsync(IntPtr h, int c); " +
    "[DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport(\"user32.dll\")] public static extern void keybd_event(byte v, byte s, uint f, UIntPtr e);'; " +
    "if ($w::IsIconic($h)) { [void]$w::ShowWindowAsync($h, 9) }; " +
    "$w::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [void]$w::SetForegroundWindow($h); $w::keybd_event(0x12, 0, 2, [UIntPtr]::Zero) }";
  try { sh.Run('"' + ps + '" -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ' + b64u16(code), 0, true); } catch (x) {}
}

var pid = running();
if (pid) {
  /* prima subito in primo piano (finestra aperta: nessuna attesa), poi il ripristino se era ridotta a icona:
     AppActivate risponde "riuscito" anche su una finestra ridotta, senza riaprirla */
  sh.AppActivate(pid);
  restore(pid);
  if (!sh.AppActivate(pid)) { WScript.Sleep(300); sh.AppActivate(pid); }
} else if (hta) {
  sh.Run('"' + mshta() + '" "' + hta + '"' + (url ? ' "' + url + '"' : ""), 1, false);
}
