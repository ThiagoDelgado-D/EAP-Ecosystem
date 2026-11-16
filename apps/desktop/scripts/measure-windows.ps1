param(
  [Parameter(Mandatory)] [string] $Shell,
  [Parameter(Mandatory)] [string] $Installer,
  [Parameter(Mandatory)] [string] $OutFile,
  [int] $Launches = 5,
  [int] $IdleSeconds = 20,
  [int] $ReadyTimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"
trap {
  Write-Host "Failed at line $($_.InvocationInfo.ScriptLineNumber): $($_.InvocationInfo.Line.Trim())"
  Write-Host $_.ScriptStackTrace
  break
}

function Get-EpochMillis { [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }

function Get-FolderBytes([string] $Path) {
  (Get-ChildItem -LiteralPath $Path -Recurse -File -Force | Measure-Object -Property Length -Sum).Sum
}

function Find-InstalledApp {
  $roots = @((Join-Path $env:LOCALAPPDATA "Programs"), $env:LOCALAPPDATA)
  $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Date) -lt $deadline) {
    foreach ($root in $roots) {
      $found = Get-ChildItem -LiteralPath $root -Filter "Cauce.exe" -File -Recurse -Depth 2 -ErrorAction SilentlyContinue |
        Select-Object -First 1
      if ($found) { return $found.FullName }
    }
    Start-Sleep -Seconds 1
  }
  throw "Cauce.exe not found after install under: $($roots -join ', ')"
}

function Get-ProcessTree([int] $RootId) {
  $all = Get-CimInstance Win32_Process
  $tree = @{}
  $queue = [System.Collections.Generic.Queue[int]]::new()
  $queue.Enqueue($RootId)
  while ($queue.Count -gt 0) {
    $id = $queue.Dequeue()
    $entry = $all | Where-Object ProcessId -eq $id | Select-Object -First 1
    if (-not $entry -or $tree.ContainsKey($id)) { continue }
    $tree[$id] = $entry
    $all | Where-Object ParentProcessId -eq $id | ForEach-Object { $queue.Enqueue([int] $_.ProcessId) }
  }
  $all | Where-Object {
    $_.Name -eq "msedgewebview2.exe" -and $_.CommandLine -like "*study.cauce.desktop*" -and -not $tree.ContainsKey([int] $_.ProcessId)
  } | ForEach-Object { $tree[[int] $_.ProcessId] = $_ }
  return @($tree.Values | ForEach-Object { $_ })
}

function Measure-Memory([int] $RootId) {
  $processes = @(Get-ProcessTree $RootId)
  $byName = $processes | Group-Object Name | ForEach-Object {
    [ordered] @{
      name = $_.Name
      count = $_.Count
      workingSetMB = [math]::Round((($_.Group | Measure-Object WorkingSetSize -Sum).Sum) / 1MB, 1)
      privateMB = [math]::Round((($_.Group | Measure-Object PrivatePageCount -Sum).Sum) / 1MB, 1)
    }
  }
  [ordered] @{
    processCount = $processes.Count
    workingSetMB = [math]::Round((($processes | Measure-Object WorkingSetSize -Sum).Sum) / 1MB, 1)
    privateMB = [math]::Round((($processes | Measure-Object PrivatePageCount -Sum).Sum) / 1MB, 1)
    byProcess = @($byName)
  }
}

function Stop-Tree([int] $RootId) {
  Get-ProcessTree $RootId | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

$installerBytes = (Get-Item -LiteralPath $Installer).Length
Start-Process -FilePath $Installer -ArgumentList "/S" -Wait
$app = Find-InstalledApp
$installDir = Split-Path -Parent $app
$installedBytes = Get-FolderBytes $installDir

$measureFile = Join-Path $env:RUNNER_TEMP "cauce-ready-$Shell.txt"
$env:CAUCE_MEASURE_FILE = $measureFile
$runs = @()
$memory = $null

for ($run = 1; $run -le $Launches; $run++) {
  Remove-Item -LiteralPath $measureFile -Force -ErrorAction SilentlyContinue
  $startedAt = Get-EpochMillis
  $process = Start-Process -FilePath $app -PassThru

  $deadline = (Get-Date).AddSeconds($ReadyTimeoutSeconds)
  while (-not (Test-Path -LiteralPath $measureFile) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 50
  }
  if (-not (Test-Path -LiteralPath $measureFile)) {
    Get-ProcessTree $process.Id | ForEach-Object { Write-Host "still running: $($_.Name) $($_.ProcessId)" }
    Stop-Tree $process.Id
    throw "$Shell run $run did not show the app within $ReadyTimeoutSeconds s"
  }
  Start-Sleep -Milliseconds 200
  $readyMs = [long] (Get-Content -LiteralPath $measureFile -Raw).Trim() - $startedAt

  if ($run -eq $Launches) {
    Start-Sleep -Seconds $IdleSeconds
    $memory = Measure-Memory $process.Id
  }

  $treeIds = @(Get-ProcessTree $process.Id | ForEach-Object { [int] $_.ProcessId })
  $closingAt = Get-EpochMillis
  $null = $process.CloseMainWindow()
  $closeDeadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $closeDeadline) {
    $alive = @($treeIds | Where-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
    if ($alive.Count -eq 0) { break }
    Start-Sleep -Milliseconds 50
  }
  $leftovers = @($treeIds | Where-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
  $closeMs = (Get-EpochMillis) - $closingAt
  $leftovers | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

  Write-Host "$Shell run ${run}: ready ${readyMs} ms, closed in ${closeMs} ms, leftovers $($leftovers.Count)"
  $runs += [ordered] @{
    run = $run
    firstLaunch = ($run -eq 1)
    readyMs = $readyMs
    closeMs = $closeMs
    leftoverProcesses = $leftovers.Count
  }
  Start-Sleep -Seconds 2
}

$warm = @($runs | Where-Object { -not $_.firstLaunch } | ForEach-Object { $_.readyMs } | Sort-Object)
$result = [ordered] @{
  shell = $Shell
  runner = "$([System.Environment]::OSVersion.VersionString), $([System.Environment]::ProcessorCount) CPUs"
  installerMB = [math]::Round($installerBytes / 1MB, 1)
  installedMB = [math]::Round($installedBytes / 1MB, 1)
  firstLaunchReadyMs = $runs[0].readyMs
  warmReadyMedianMs = $warm[[math]::Floor($warm.Count / 2)]
  idleMemory = $memory
  runs = $runs
}
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $OutFile -Encoding utf8
Get-Content -LiteralPath $OutFile
