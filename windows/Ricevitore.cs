// DownConvertron - ricevitore del trascinamento per Windows (designed by Welsho)
// Copyright (C) 2026 Daniele Moretti (Welsho) - licenza GPL-3.0-or-later (vedi LICENSE)
// Finestra quasi invisibile (opacita' 1%) che compare sopra l'app solo mentre trascini dei file:
// e' una vera destinazione OLE di Windows, quindi riceve i percorsi completi di TUTTI i file e
// cartelle (DataFormats.FileDrop), senza il controllo di Internet Explorer e senza "Apri o salva".
// Comunicazione con l'HTA tramite file nella cartella di scambio:
//   HTA -> show.txt  "larghezzaCss altezzaCss zonaX zonaY zonaL zonaA"  (mostra la finestra)
//          quit.flag                                                     (chiude il ricevitore)
//   ricevitore -> ready.flag (pronto)  in.flag (puntatore sulla botola)  leave.flag (uscito)
//                 drop_<n>.txt  "@x,y" + un percorso per riga (UTF-8)  error.txt (problemi)
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using ComDataObject = System.Runtime.InteropServices.ComTypes.IDataObject;
using System.Runtime.InteropServices.ComTypes;

namespace DcvtDrop
{
    // Anteprima di Windows sotto il puntatore (miniature dei file + scritta "Copia in DownConvertron"),
    // la stessa che si vede trascinando tra cartelle di Esplora file.
    [ComImport, Guid("4657278B-411B-11D2-839A-00C04FD918D0"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IDropTargetHelper
    {
        void DragEnter(IntPtr hwndTarget, ComDataObject dataObject, ref ShellPoint pt, int effect);
        void DragLeave();
        void DragOver(ref ShellPoint pt, int effect);
        void Drop(ComDataObject dataObject, ref ShellPoint pt, int effect);
        void Show(bool show);
    }
    [ComImport, Guid("4657278A-411B-11D2-839A-00C04FD918D0")]
    class DragDropHelper { }
    [StructLayout(LayoutKind.Sequential)] public struct ShellPoint { public int X, Y; }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct DropDescription
    {
        public int type;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string message;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string insert;
    }

    public class Ricevitore : Form
    {
        [StructLayout(LayoutKind.Sequential)] struct RECT { public int Left, Top, Right, Bottom; }
        [StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; }
        delegate bool EnumProc(IntPtr h, IntPtr l);

        [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
        [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
        [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
        [DllImport("user32.dll")] static extern bool GetClientRect(IntPtr h, out RECT r);
        [DllImport("user32.dll")] static extern bool ClientToScreen(IntPtr h, ref POINT p);
        [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
        [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr l);
        [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder sb, int n);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder sb, int n);
        [DllImport("user32.dll")] static extern short GetAsyncKeyState(int vk);
        [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern uint RegisterClipboardFormat(string name);
        [DllImport("kernel32.dll")] static extern IntPtr GlobalAlloc(uint flags, UIntPtr bytes);
        [DllImport("kernel32.dll")] static extern IntPtr GlobalLock(IntPtr h);
        [DllImport("kernel32.dll")] static extern bool GlobalUnlock(IntPtr h);

        const string HTA_CLASS = "HTML Application Host Window Class";
        static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
        const uint SWP_NOACTIVATE = 0x0010, SWP_SHOWWINDOW = 0x0040, SWP_HIDEWINDOW = 0x0080;

        readonly string dir;
        readonly IntPtr target;
        readonly Timer timer;
        DateTime armedAt = DateTime.MinValue;
        double ratio = 1;
        double zx, zy, zw, zh;
        bool inZone, armed;
        string lang = "it";
        IDropTargetHelper shell;
        ComDataObject lastData;
        int seq;

        // ---------- avvio ----------
        public static int Run(string dir, int parentPid, string title)
        {
            try { SetProcessDPIAware(); } catch (Exception) { }   // coordinate fisiche, come quelle del trascinamento
            try { Directory.CreateDirectory(dir); } catch (Exception) { }
            IntPtr h = IntPtr.Zero;
            for (int i = 0; i < 60 && h == IntPtr.Zero; i++)
            {
                h = FindHta(parentPid, title);
                if (h == IntPtr.Zero) System.Threading.Thread.Sleep(250);
            }
            if (h == IntPtr.Zero) { WriteText(Path.Combine(dir, "error.txt"), "finestra dell'app non trovata (pid " + parentPid + ")"); return 2; }
            Ricevitore f = new Ricevitore(dir, h);
            IntPtr own = f.Handle;                 // crea la finestra (e la registra come destinazione OLE) senza mostrarla
            Application.Run(new ApplicationContext());
            return 0;
        }

        // la finestra dell'HTA che ci ha avviato: prima per processo padre, poi per titolo
        static IntPtr FindHta(int pid, string title)
        {
            IntPtr byPid = IntPtr.Zero, byTitle = IntPtr.Zero;
            EnumWindows(delegate (IntPtr h, IntPtr l)
            {
                if (!IsWindowVisible(h)) return true;
                StringBuilder cls = new StringBuilder(128);
                GetClassName(h, cls, cls.Capacity);
                if (cls.ToString() != HTA_CLASS) return true;
                uint p; GetWindowThreadProcessId(h, out p);
                if (pid > 0 && p == (uint)pid && byPid == IntPtr.Zero) byPid = h;
                if (!string.IsNullOrEmpty(title))
                {
                    StringBuilder t = new StringBuilder(256);
                    GetWindowText(h, t, t.Capacity);
                    if (t.ToString().StartsWith(title, StringComparison.OrdinalIgnoreCase) && byTitle == IntPtr.Zero) byTitle = h;
                }
                return true;
            }, IntPtr.Zero);
            return byPid != IntPtr.Zero ? byPid : byTitle;
        }

        Ricevitore(string dir, IntPtr target)
        {
            this.dir = dir;
            this.target = target;
            Text = "DownConvertron - ricevitore";
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.Manual;
            BackColor = Color.Black;
            Opacity = 0.01;                 // finestra stratificata: invisibile all'occhio, ma riceve il rilascio
            TopMost = true;
            AllowDrop = true;
            Bounds = new Rectangle(-32000, -32000, 8, 8);
            Visible = false;
            try { shell = (IDropTargetHelper)new DragDropHelper(); } catch (Exception) { shell = null; }
            DragEnter += OnEnter;
            DragOver += OnDrag;
            DragLeave += OnLeave;
            DragDrop += OnDrop;
            timer = new Timer();
            timer.Interval = 30;
            timer.Tick += OnTick;
            timer.Start();
            WriteText(Path.Combine(dir, "ready.flag"), Process.GetCurrentProcess().Id.ToString());
        }

        // mai attivata, mai in Alt+Tab
        protected override bool ShowWithoutActivation { get { return true; } }
        protected override CreateParams CreateParams
        {
            get { CreateParams cp = base.CreateParams; cp.ExStyle |= 0x08000000 /* NOACTIVATE */ | 0x00000080 /* TOOLWINDOW */; return cp; }
        }

        // ---------- ciclo ----------
        void OnTick(object sender, EventArgs e)
        {
            if (!IsWindow(target) || File.Exists(Path.Combine(dir, "quit.flag"))) { Quit(); return; }
            if (!Directory.Exists(dir)) { try { Directory.CreateDirectory(dir); WriteText(Path.Combine(dir, "ready.flag"), "1"); } catch (Exception) { } }
            string sig = Path.Combine(dir, "show.txt");
            if (File.Exists(sig))
            {
                string t = ReadText(sig);
                if (t != null && Arm(t)) TryDelete(sig);
            }
            // sicurezza: tasti del mouse rilasciati senza rilascio su di noi -> mi tolgo di mezzo,
            // cosi' l'app sotto non resta mai coperta
            if (armed && (DateTime.Now - armedAt).TotalMilliseconds > 500 && !ButtonsDown()) Disarm(true);
        }

        static bool ButtonsDown()
        {
            return (GetAsyncKeyState(0x01) & 0x8000) != 0 || (GetAsyncKeyState(0x02) & 0x8000) != 0 || (GetAsyncKeyState(0x04) & 0x8000) != 0;
        }

        bool Arm(string t)
        {
            string[] v = t.Trim().Split(new char[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            if (v.Length < 6) return false;
            lang = v.Length > 6 ? v[6] : "it";
            double cssW, cssH;
            if (!double.TryParse(v[0], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out cssW) || cssW <= 0) return false;
            double.TryParse(v[1], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out cssH);
            double.TryParse(v[2], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out zx);
            double.TryParse(v[3], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out zy);
            double.TryParse(v[4], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out zw);
            double.TryParse(v[5], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out zh);
            // finestra ridotta o non misurabile: non mi mostro e lo dico all'app
            string leave = Path.Combine(dir, "leave.flag");
            if (IsIconic(target)) { WriteText(leave, "1"); return true; }
            RECT r; POINT o = new POINT();
            if (!GetClientRect(target, out r) || !ClientToScreen(target, ref o)) { WriteText(leave, "1"); return true; }
            int w = r.Right - r.Left, hgt = r.Bottom - r.Top;
            if (w < 20 || hgt < 20) { WriteText(leave, "1"); return true; }
            ratio = w / cssW;                       // pixel reali per pixel CSS (ridimensionamento di Windows)
            inZone = false;
            armed = true;
            armedAt = DateTime.Now;
            SetWindowPos(Handle, HWND_TOPMOST, o.X, o.Y, w, hgt, SWP_NOACTIVATE | SWP_SHOWWINDOW);
            return true;
        }

        void Disarm(bool left)
        {
            if (!armed) return;
            armed = false;
            SetWindowPos(Handle, HWND_TOPMOST, -32000, -32000, 8, 8, SWP_NOACTIVATE | SWP_HIDEWINDOW);
            SetZone(false);
            if (left) WriteText(Path.Combine(dir, "leave.flag"), "1");
        }

        void Quit()
        {
            timer.Stop();
            TryDelete(Path.Combine(dir, "ready.flag"));
            TryDelete(Path.Combine(dir, "in.flag"));
            TryDelete(Path.Combine(dir, "quit.flag"));
            Application.ExitThread();
        }

        // ---------- trascinamento ----------
        static bool HasFiles(DragEventArgs e)
        {
            try { return e.Data != null && e.Data.GetDataPresent(DataFormats.FileDrop); } catch (Exception) { return false; }
        }

        // sempre COPIA: con "sposta" Esplora file cancellerebbe l'originale
        static DragDropEffects Effect(DragEventArgs e)
        {
            if (!HasFiles(e)) return DragDropEffects.None;
            if ((e.AllowedEffect & DragDropEffects.Copy) != 0) return DragDropEffects.Copy;
            if ((e.AllowedEffect & DragDropEffects.Link) != 0) return DragDropEffects.Link;
            return DragDropEffects.None;
        }

        static ShellPoint Pt(DragEventArgs e) { ShellPoint p; p.X = e.X; p.Y = e.Y; return p; }
        string Message()
        {
            if (lang == "en") return "Copy to %1";
            if (lang == "zh") return "\u590d\u5236\u5230 %1";
            return "Copia in %1";
        }
        // scritta accanto al puntatore; tipo -1 la toglie (importante quando esci, per non lasciarla a Esplora file)
        static void Describe(ComDataObject d, int type, string msg, string ins)
        {
            if (d == null) return;
            try
            {
                FORMATETC f = new FORMATETC();
                f.cfFormat = unchecked((short)RegisterClipboardFormat("DropDescription"));
                f.dwAspect = DVASPECT.DVASPECT_CONTENT; f.lindex = -1; f.ptd = IntPtr.Zero; f.tymed = TYMED.TYMED_HGLOBAL;
                DropDescription dd = new DropDescription(); dd.type = type; dd.message = msg; dd.insert = ins;
                int size = Marshal.SizeOf(typeof(DropDescription));
                IntPtr h = GlobalAlloc(0x0042 /* GHND */, new UIntPtr((uint)size));
                if (h == IntPtr.Zero) return;
                IntPtr ptr = GlobalLock(h);
                Marshal.StructureToPtr(dd, ptr, false);
                GlobalUnlock(h);
                STGMEDIUM m = new STGMEDIUM(); m.tymed = TYMED.TYMED_HGLOBAL; m.unionmember = h; m.pUnkForRelease = null;
                d.SetData(ref f, ref m, true);
            }
            catch (Exception) { }
        }
        void OnEnter(object sender, DragEventArgs e)
        {
            OnDrag(sender, e);
            ComDataObject d = e.Data as ComDataObject;
            lastData = d;
            if (HasFiles(e)) Describe(d, 1 /* DROPIMAGE_COPY */, Message(), "DownConvertron");
            if (shell != null && d != null) { try { ShellPoint p = Pt(e); shell.DragEnter(Handle, d, ref p, (int)e.Effect); } catch (Exception) { } }
        }
        void OnDrag(object sender, DragEventArgs e)
        {
            e.Effect = Effect(e);
            armedAt = DateTime.Now;
            Point c = Css(e.X, e.Y);
            SetZone(c.X >= zx && c.X <= zx + zw && c.Y >= zy && c.Y <= zy + zh);
            if (shell != null && e.Data is ComDataObject) { try { ShellPoint p = Pt(e); shell.DragOver(ref p, (int)e.Effect); } catch (Exception) { } }
        }

        void OnLeave(object sender, EventArgs e)
        {
            if (shell != null) { try { shell.DragLeave(); } catch (Exception) { } }
            Describe(lastData, -1, "", "");
            lastData = null;
            Disarm(true);
        }

        void OnDrop(object sender, DragEventArgs e)
        {
            string[] files = null;
            try { files = e.Data.GetData(DataFormats.FileDrop) as string[]; } catch (Exception) { }
            Point c = Css(e.X, e.Y);
            ComDataObject cd = e.Data as ComDataObject;
            Describe(cd, -1, "", "");
            if (shell != null && cd != null) { try { ShellPoint p = Pt(e); shell.Drop(cd, ref p, (int)e.Effect); } catch (Exception) { } }
            if (files != null && files.Length > 0)
            {
                StringBuilder sb = new StringBuilder();
                sb.Append('@').Append(c.X).Append(',').Append(c.Y).Append('\n');
                foreach (string f in files) if (!string.IsNullOrEmpty(f)) sb.Append(f).Append('\n');
                seq++;
                string name = "drop_" + DateTime.Now.Ticks + "_" + seq + ".txt";
                string tmp = Path.Combine(dir, name + ".tmp");
                if (WriteText(tmp, sb.ToString()))
                {
                    try { File.Move(tmp, Path.Combine(dir, name)); } catch (Exception ex) { WriteText(Path.Combine(dir, "error.txt"), "rilascio: " + ex.Message); }
                }
            }
            // nascondo dopo aver restituito il controllo a Esplora file
            BeginInvoke(new MethodInvoker(delegate { Disarm(files == null || files.Length == 0); }));
        }

        Point Css(int sx, int sy)
        {
            Point p = PointToClient(new Point(sx, sy));
            return new Point((int)Math.Round(p.X / ratio), (int)Math.Round(p.Y / ratio));
        }

        void SetZone(bool v)
        {
            if (v == inZone) return;
            inZone = v;
            string f = Path.Combine(dir, "in.flag");
            if (v) WriteText(f, "1"); else TryDelete(f);
        }

        // ---------- file ----------
        static bool WriteText(string path, string text)
        {
            for (int i = 0; i < 5; i++)
            {
                try { File.WriteAllText(path, text, new UTF8Encoding(false)); return true; }
                catch (Exception) { System.Threading.Thread.Sleep(15); }
            }
            return false;
        }
        static string ReadText(string path)
        {
            try { return File.ReadAllText(path); } catch (Exception) { return null; }
        }
        static void TryDelete(string path)
        {
            try { if (File.Exists(path)) File.Delete(path); } catch (Exception) { }
        }
    }
}
