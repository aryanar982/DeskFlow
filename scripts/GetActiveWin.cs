using System;
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;

class Program
{
    private const uint EVENT_SYSTEM_FOREGROUND = 0x0003;
    private const uint WINEVENT_OUTOFPROCESS = 0x0000;
    private const uint WINEVENT_SKIPOWNPROCESS = 0x0002;

    private delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

    [DllImport("user32.dll")]
    static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

    [DllImport("user32.dll")]
    static extern bool UnhookWinEvent(IntPtr hWinEventHook);

    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    static extern bool GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    static extern bool TranslateMessage([In] ref MSG lpMsg);

    [DllImport("user32.dll")]
    static extern IntPtr DispatchMessage([In] ref MSG lpMsg);

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public POINT pt;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int x;
        public int y;
    }

    private static WinEventDelegate _delegate;
    private static IntPtr _hook;
    private static string _lastProc = "";
    private static string _lastTitle = "";

    static void PrintWindowInfo(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero)
        {
            EmitJson("desktop", "Desktop");
            return;
        }

        uint pid = 0;
        GetWindowThreadProcessId(hwnd, out pid);

        StringBuilder sb = new StringBuilder(512);
        GetWindowText(hwnd, sb, 512);
        string title = sb.ToString();

        if (pid > 0)
        {
            try
            {
                Process proc = Process.GetProcessById((int)pid);
                string procName = proc != null ? proc.ProcessName.ToLower() : "unknown";
                if (string.IsNullOrEmpty(title) && proc != null)
                {
                    title = proc.MainWindowTitle;
                }
                EmitJson(procName, title);
                return;
            }
            catch
            {
            }
        }
        EmitJson("unknown", "Unknown");
    }

    static void EmitJson(string procName, string title)
    {
        string cleanProc = (procName ?? "unknown").ToLower();
        string cleanTitle = (title ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", "");
        
        if (cleanProc == _lastProc && cleanTitle == _lastTitle) return;

        _lastProc = cleanProc;
        _lastTitle = cleanTitle;

        Console.WriteLine("{\"processName\":\"" + cleanProc + "\",\"windowTitle\":\"" + cleanTitle + "\"}");
        Console.Out.Flush();
    }

    static void WinEventProc(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
    {
        if (eventType == EVENT_SYSTEM_FOREGROUND)
        {
            PrintWindowInfo(hwnd);
        }
    }

    static void Main(string[] args)
    {
        bool listenMode = args.Length > 0 && args[0].ToLower() == "listen";

        if (!listenMode)
        {
            IntPtr hwnd = GetForegroundWindow();
            PrintWindowInfo(hwnd);
            return;
        }

        IntPtr currentHwnd = GetForegroundWindow();
        PrintWindowInfo(currentHwnd);

        _delegate = new WinEventDelegate(WinEventProc);
        _hook = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            IntPtr.Zero,
            _delegate,
            0,
            0,
            WINEVENT_OUTOFPROCESS | WINEVENT_SKIPOWNPROCESS
        );

        MSG msg;
        while (GetMessage(out msg, IntPtr.Zero, 0, 0))
        {
            TranslateMessage(ref msg);
            DispatchMessage(ref msg);
        }

        if (_hook != IntPtr.Zero)
        {
            UnhookWinEvent(_hook);
        }
    }
}

