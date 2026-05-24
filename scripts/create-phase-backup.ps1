param(
  [Parameter(Mandatory = $true)]
  [string]$PhaseId,
  [string]$ProjectRoot = "C:\Users\55479\Desktop\EchonX",
  [string]$BackupRoot = "C:\Users\55479\Desktop\EchonX-backups"
)

$ErrorActionPreference = "Stop"
$destDir = Join-Path $BackupRoot $PhaseId
$zip = Join-Path $destDir "EchonX-full-source.zip"

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
if (Test-Path $zip) { Remove-Item $zip -Force }

Push-Location $ProjectRoot
try {
  tar -a -c -f $zip `
    --exclude=node_modules `
    --exclude=.next `
    --exclude=.next-dev `
    --exclude=backups `
    --exclude=EchonX-backups `
    --exclude=.git `
    .
  $count = (tar -tf $zip | Measure-Object).Count
  $bytes = (Get-Item $zip).Length
  Write-Host "Backup OK: $zip"
  Write-Host "Files: $count | Size: $bytes bytes"

  $mirror = Join-Path $destDir "EchonX-mirror"
  if (Test-Path $mirror) { Remove-Item $mirror -Recurse -Force }
  robocopy $ProjectRoot $mirror /MIR /XD node_modules .next .next-dev backups EchonX-backups .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  Write-Host "Mirror OK: $mirror"
}
finally {
  Pop-Location
}
