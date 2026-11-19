param([string]$Title = 'DSH', [string]$Body = 'task done')
$ErrorActionPreference = 'Stop'
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$textNodes = $template.GetElementsByTagName('text')
$textNodes.Item(0).AppendChild($template.CreateTextNode($Title)) | Out-Null
$textNodes.Item(1).AppendChild($template.CreateTextNode($Body)) | Out-Null
# 系统声音方案是「无声音」，toast 自带的声音不会响；关掉它，下面自己放 wav。
$toastEl = $template.SelectSingleNode('/toast')
$audio = $template.CreateElement('audio')
$audio.SetAttribute('silent', 'true')
$toastEl.AppendChild($audio) | Out-Null
$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
# High 优先级：全屏/演示时也能弹出（默认优先级会被 Windows 直接丢掉）。
$toast.Priority = [Windows.UI.Notifications.ToastNotificationPriority]::High
$appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
# 自己播放提示音（不受声音方案影响，但受系统音量/静音影响）。
$wav = 'C:\Windows\Media\notify.wav'
if (Test-Path $wav) {
  try { (New-Object System.Media.SoundPlayer $wav).PlaySync() } catch {}
}
