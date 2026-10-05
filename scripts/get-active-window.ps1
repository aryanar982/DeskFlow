$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class Win32Window {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder strText, int maxCount);
}
"@

if (-not ([System.Management.Automation.PSTypeName]'Win32Window').Type) {
    Add-Type -TypeDefinition $code
}

$hwnd = [Win32Window]::GetForegroundWindow()
if ($hwnd -ne [IntPtr]::Zero) {
    $pidOut = 0
    [Win32Window]::GetWindowThreadProcessId($hwnd, [ref]$pidOut)
    
    $sb = New-Object System.Text.StringBuilder 512
    [Win32Window]::GetWindowText($hwnd, $sb, $sb.Capacity) | Out-Null
    $title = $sb.ToString()

    if ($pidOut -gt 0) {
        $proc = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
        if ($proc) {
            [PSCustomObject]@{
                processName = $proc.ProcessName
                windowTitle = if ($title) { $title } else { $proc.MainWindowTitle }
                path = $proc.Path
            } | ConvertTo-Json -Compress
        }
    }
}
