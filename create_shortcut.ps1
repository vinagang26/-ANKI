$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path -Path $Desktop -ChildPath "Chinese Flashcards.lnk"
$ExePath = "c:\Users\Admin\OneDrive\Tài liệu\GitHub\-ANKI\dist\ChineseAnki.exe"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $ExePath
$Shortcut.WorkingDirectory = "c:\Users\Admin\OneDrive\Tài liệu\GitHub\-ANKI\dist"
$Shortcut.Description = "Chinese Vocab Liquid Glass Anki Desktop App"
$Shortcut.Save()

Write-Host "Updated desktop shortcut pointing directly to standalone EXE: $ExePath"
