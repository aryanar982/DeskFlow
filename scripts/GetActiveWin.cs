using System;
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;

class Program
{
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    static void Main()
    {
        try
        {
            IntPtr hwnd = GetForegroundWindow();
            if (hwnd == IntPtr.Zero)
            {
                Console.WriteLine("{\"processName\":\"desktop\",\"windowTitle\":\"Desktop\"}");
                return;
            }

            uint pid = 0;
            GetWindowThreadProcessId(hwnd, out pid);

            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hwnd, sb, 512);
            string title = sb.ToString();

            if (pid > 0)
            {
                Process proc = Process.GetProcessById((int)pid);
                string procName = proc != null ? proc.ProcessName.ToLower() : "unknown";
                if (string.IsNullOrEmpty(title) && proc != null)
                {
                    title = proc.MainWindowTitle;
                }
                
                string cleanTitle = (title ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", "");
                Console.WriteLine("{\"processName\":\"" + procName + "\",\"windowTitle\":\"" + cleanTitle + "\"}");
                return;
            }
        }
        catch (Exception ex)
        {
            // Silently handle error
        }
        Console.WriteLine("{\"processName\":\"unknown\",\"windowTitle\":\"Unknown\"}");
    }
}
