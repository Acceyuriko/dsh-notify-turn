# notify-turn

Host plugin. Pops a Windows toast when a top-level session's turn finishes.

- Mounted inside the `dafeiyu` preset's plugin list, so it applies to new sessions.
- `agent/status` is agent-scoped: each instance only hears its own agent.
- Skips subagent sessions (`header.origin === 'subagent'`).
- Only fires when the turn ran at least `minSeconds` (default 10), so short replies
  do not pop a toast.
- Toast is shown by `toast.ps1` through Windows PowerShell 5.1 (`Windows.UI.Notifications`).
- `toast.ps1` sets `ToastNotificationPriority.High`: the default priority is dropped
  by Windows while a full-screen app is in front (`SHQueryUserNotificationState` = 2).
- The system sound scheme is `.None` on this machine, so the toast's own audio is
  silent. The script disables it (`<audio silent="true"/>`) and plays
  `C:\Windows\Media\notify.wav` with `System.Media.SoundPlayer` instead.

Source: [`notify-turn`](notify-turn/).
