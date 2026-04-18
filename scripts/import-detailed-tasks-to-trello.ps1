param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [Parameter(Mandatory = $true)]
  [string]$ApiToken,

  [Parameter(Mandatory = $false)]
  [string]$BoardShortId = "3Y35226h",

  [Parameter(Mandatory = $true)]
  [string]$CatalogPath
)

$ErrorActionPreference = "Stop"

function Invoke-TrelloGet {
  param(
    [string]$Path,
    [hashtable]$Query
  )

  $params = @{ key = $ApiKey; token = $ApiToken }
  if ($Query) {
    foreach ($k in $Query.Keys) { $params[$k] = $Query[$k] }
  }

  $queryString = ($params.GetEnumerator() | ForEach-Object {
    "{0}={1}" -f [System.Uri]::EscapeDataString($_.Key), [System.Uri]::EscapeDataString([string]$_.Value)
  }) -join "&"

  $url = "https://api.trello.com/1/$Path`?$queryString"
  return Invoke-RestMethod -Method Get -Uri $url
}

function Invoke-TrelloPost {
  param(
    [string]$Path,
    [hashtable]$Body
  )

  $params = @{ key = $ApiKey; token = $ApiToken }
  foreach ($k in $Body.Keys) { $params[$k] = $Body[$k] }

  $queryString = ($params.GetEnumerator() | ForEach-Object {
    "{0}={1}" -f [System.Uri]::EscapeDataString($_.Key), [System.Uri]::EscapeDataString([string]$_.Value)
  }) -join "&"

  $url = "https://api.trello.com/1/$Path`?$queryString"
  return Invoke-RestMethod -Method Post -Uri $url
}

if (-not (Test-Path $CatalogPath)) {
  throw "Catalog file not found: $CatalogPath"
}

Write-Host "Loading board by short id..."
$board = Invoke-TrelloGet -Path "boards/$BoardShortId" -Query @{ fields = "id,name,url" }

Write-Host "Loading lists and labels..."
$lists = Invoke-TrelloGet -Path "boards/$($board.id)/lists" -Query @{ fields = "id,name"; filter = "open" }
$listByName = @{}
foreach ($l in $lists) { $listByName[$l.name] = $l.id }

$labels = Invoke-TrelloGet -Path "boards/$($board.id)/labels" -Query @{ fields = "id,name,color"; limit = "1000" }
$labelByName = @{}
foreach ($lb in $labels) { $labelByName[$lb.name] = $lb.id }

$existingCards = Invoke-TrelloGet -Path "boards/$($board.id)/cards" -Query @{ fields = "id,name"; filter = "open" }
$existingNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($c in $existingCards) { [void]$existingNames.Add($c.name) }

$categoryColors = @{
  "Architecture"  = "blue"
  "Backend"       = "green"
  "Frontend"      = "sky"
  "Firebase"      = "lime"
  "Security"      = "red"
  "QA"            = "orange"
  "DevOps"        = "black"
  "Payments"      = "yellow"
  "Onboarding"    = "purple"
  "Marketplace"   = "pink"
  "AI"            = "sky"
  "Loyalty"       = "orange"
  "Documentation" = "blue"
}

foreach ($cat in $categoryColors.Keys) {
  if (-not $labelByName.ContainsKey($cat)) {
    $created = Invoke-TrelloPost -Path "labels" -Body @{ idBoard = $board.id; name = $cat; color = $categoryColors[$cat] }
    $labelByName[$cat] = $created.id
  }
}

$lines = Get-Content -Path $CatalogPath
$currentSource = ""
$tasks = @()

foreach ($line in $lines) {
  if ($line -match '^###\s+\*\*\[(.+?)\]\(') {
    $currentSource = $matches[1]
    continue
  }

  if ($line -match '^\|\s*[^|]+\|\s*([^|]+)\|\s*([^|]+)\|\s*$') {
    $taskText = $matches[1].Trim()
    $category = $matches[2].Trim()

    if ($taskText -eq "Task" -or $category -eq "Category") { continue }
    if (-not $currentSource) { continue }

    $tasks += [PSCustomObject]@{
      Source   = $currentSource
      Task     = $taskText
      Category = $category
    }
  }
}

if ($tasks.Count -eq 0) {
  throw "No tasks parsed from catalog. Check file format."
}

function Resolve-ListName {
  param([string]$Source)

  if ($Source -like "MULTITENANT_WEEKS_1_TO_4*") { return "Ready" }
  if ($Source -like "*DAY1*") { return "Ready" }
  if ($Source -like "MULTITENANT_COMPANION_EXECUTION_BLUEPRINT*") { return "Ready" }
  return "Backlog"
}

$createdCount = 0
$skippedCount = 0

Write-Host "Importing cards..."
foreach ($t in $tasks) {
  $sourceShort = $t.Source -replace '\.md$', ''
  $name = "[$sourceShort] $($t.Task)"
  if ($name.Length -gt 160) {
    $name = $name.Substring(0, 157) + "..."
  }

  if ($existingNames.Contains($name)) {
    $skippedCount++
    continue
  }

  $lane = Resolve-ListName -Source $t.Source
  if (-not $listByName.ContainsKey($lane)) { $lane = "Backlog" }

  $labelId = ""
  if ($labelByName.ContainsKey($t.Category)) {
    $labelId = $labelByName[$t.Category]
  }

  $desc = @(
    "Source: documentation/$($t.Source)",
    "Category: $($t.Category)",
    "Imported: $(Get-Date -Format 'yyyy-MM-dd')"
  ) -join "`n"

  $body = @{
    idList = $listByName[$lane]
    name   = $name
    desc   = $desc
  }
  if ($labelId) {
    $body["idLabels"] = $labelId
  }

  Invoke-TrelloPost -Path "cards" -Body $body | Out-Null
  [void]$existingNames.Add($name)
  $createdCount++
}

Write-Host ("Board: {0}" -f $board.url)
Write-Host ("Parsed tasks: {0}" -f $tasks.Count)
Write-Host ("Created cards: {0}" -f $createdCount)
Write-Host ("Skipped existing: {0}" -f $skippedCount)
