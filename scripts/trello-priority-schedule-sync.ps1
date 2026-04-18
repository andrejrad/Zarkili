param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [Parameter(Mandatory = $true)]
  [string]$ApiToken,

  [Parameter(Mandatory = $false)]
  [string]$BoardShortId = "3Y35226h",

  [Parameter(Mandatory = $false)]
  [datetime]$Week1StartDate = [datetime]"2026-04-20"
)

$ErrorActionPreference = "Stop"

function New-TrelloUrl {
  param([string]$Path, [hashtable]$Params)

  $base = @{ key = $ApiKey; token = $ApiToken }
  if ($Params) {
    foreach ($k in $Params.Keys) { $base[$k] = $Params[$k] }
  }

  $qs = ($base.GetEnumerator() | ForEach-Object {
    "{0}={1}" -f [Uri]::EscapeDataString($_.Key), [Uri]::EscapeDataString([string]$_.Value)
  }) -join "&"

  return "https://api.trello.com/1/$Path`?$qs"
}

function Trello-Get {
  param([string]$Path, [hashtable]$Params)
  Invoke-RestMethod -Method Get -Uri (New-TrelloUrl -Path $Path -Params $Params)
}

function Trello-Post {
  param([string]$Path, [hashtable]$Params)
  Invoke-RestMethod -Method Post -Uri (New-TrelloUrl -Path $Path -Params $Params)
}

function Trello-Put {
  param([string]$Path, [hashtable]$Params)
  Invoke-RestMethod -Method Put -Uri (New-TrelloUrl -Path $Path -Params $Params)
}

function Ensure-Label {
  param(
    [string]$BoardId,
    [string]$Name,
    [string]$Color,
    [hashtable]$LabelMap
  )

  if ($LabelMap.ContainsKey($Name)) {
    return $LabelMap[$Name]
  }

  $created = Trello-Post -Path "labels" -Params @{
    idBoard = $BoardId
    name    = $Name
    color   = $Color
  }

  $LabelMap[$Name] = $created.id
  return $created.id
}

function Get-WeekFromText {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) { return $null }

  $m = [regex]::Match($Text, 'Week\s*(\d+)\s*-\s*(\d+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($m.Success) {
    return [int]$m.Groups[2].Value
  }

  $m2 = [regex]::Match($Text, 'Week\s*(\d+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($m2.Success) {
    return [int]$m2.Groups[1].Value
  }

  return $null
}

function Infer-Priority {
  param([string]$Name, [string]$Desc)

  $text = "$Name `n$Desc".ToLowerInvariant()

  $p0Patterns = @(
    'security', 'firestore rules', 'tenant isolation', 'billing', 'payment', 'stripe', 'auth', 'webhook', 'subscription', 'trial', 'idempotency'
  )

  foreach ($p in $p0Patterns) {
    if ($text.Contains($p)) { return 'P0' }
  }

  $p1Patterns = @(
    'booking', 'onboarding', 'marketplace', 'loyalty', 'ai', 'campaign', 'analytics', 'migration', 'reviews', 'waitlist', 'messaging'
  )

  foreach ($p in $p1Patterns) {
    if ($text.Contains($p)) { return 'P1' }
  }

  return 'P2'
}

Write-Host "Loading board, lists, labels, and cards..."
$board = Trello-Get -Path "boards/$BoardShortId" -Params @{ fields = "id,name,url" }
$lists = Trello-Get -Path "boards/$($board.id)/lists" -Params @{ fields = "id,name"; filter = "open" }
$labels = Trello-Get -Path "boards/$($board.id)/labels" -Params @{ fields = "id,name,color"; limit = "1000" }
$cards = Trello-Get -Path "boards/$($board.id)/cards" -Params @{ fields = "id,name,desc,idList,idLabels,due"; filter = "open" }

$listByName = @{}
foreach ($l in $lists) { $listByName[$l.name] = $l.id }

$labelByName = @{}
foreach ($lb in $labels) {
  if (-not [string]::IsNullOrWhiteSpace($lb.name)) {
    $labelByName[$lb.name] = $lb.id
  }
}

$p0Id = Ensure-Label -BoardId $board.id -Name "P0" -Color "red" -LabelMap $labelByName
$p1Id = Ensure-Label -BoardId $board.id -Name "P1" -Color "orange" -LabelMap $labelByName
$p2Id = Ensure-Label -BoardId $board.id -Name "P2" -Color "green" -LabelMap $labelByName

$doneListId = $null
$readyListId = $null
$inProgressListId = $null
if ($listByName.ContainsKey("Done")) { $doneListId = $listByName["Done"] }
if ($listByName.ContainsKey("Ready")) { $readyListId = $listByName["Ready"] }
if ($listByName.ContainsKey("In Progress")) { $inProgressListId = $listByName["In Progress"] }

$priorityUpdated = 0
$dueUpdated = 0
$movedToReady = 0
$movedToInProgress = 0

$week1Candidates = @()

Write-Host "Applying priority labels and due dates..."
foreach ($c in $cards) {
  if ($doneListId -and $c.idList -eq $doneListId) { continue }

  $priority = Infer-Priority -Name $c.name -Desc $c.desc
  $targetPriorityId = if ($priority -eq 'P0') { $p0Id } elseif ($priority -eq 'P1') { $p1Id } else { $p2Id }

  $hasP0 = $c.idLabels -contains $p0Id
  $hasP1 = $c.idLabels -contains $p1Id
  $hasP2 = $c.idLabels -contains $p2Id

  if (-not (($priority -eq 'P0' -and $hasP0 -and -not $hasP1 -and -not $hasP2) -or
            ($priority -eq 'P1' -and $hasP1 -and -not $hasP0 -and -not $hasP2) -or
            ($priority -eq 'P2' -and $hasP2 -and -not $hasP0 -and -not $hasP1))) {

    $nonPriorityLabels = @($c.idLabels | Where-Object { $_ -ne $p0Id -and $_ -ne $p1Id -and $_ -ne $p2Id })
    $newLabels = @($nonPriorityLabels + $targetPriorityId)
    Trello-Put -Path "cards/$($c.id)" -Params @{ idLabels = ($newLabels -join ",") } | Out-Null
    $priorityUpdated++
  }

  $week = Get-WeekFromText -Text ($c.desc + "\n" + $c.name)
  if ($week) {
    $due = $Week1StartDate.AddDays((($week - 1) * 7) + 6).ToString("o")
    if ($c.due -ne $due) {
      Trello-Put -Path "cards/$($c.id)" -Params @{ due = $due } | Out-Null
      $dueUpdated++
    }

    if ($week -eq 1) {
      $week1Candidates += [PSCustomObject]@{
        CardId   = $c.id
        CardName = $c.name
        Priority = $priority
        ListId   = $c.idList
      }
    }
  }
}

if ($week1Candidates.Count -gt 0) {
  Write-Host "Moving Week 1 cards into Ready and In Progress..."

  foreach ($w in $week1Candidates) {
    if ($doneListId -and $w.ListId -eq $doneListId) { continue }
    if ($readyListId -and $w.ListId -ne $readyListId -and $w.ListId -ne $inProgressListId) {
      Trello-Put -Path "cards/$($w.CardId)" -Params @{ idList = $readyListId } | Out-Null
      $movedToReady++
    }
  }

  if ($inProgressListId) {
    $ordered = $week1Candidates | Sort-Object @{ Expression = {
      if ($_.Priority -eq 'P0') { 1 } elseif ($_.Priority -eq 'P1') { 2 } else { 3 }
    } }, @{ Expression = { $_.CardName } }

    $top = @($ordered | Select-Object -First 5)
    foreach ($t in $top) {
      Trello-Put -Path "cards/$($t.CardId)" -Params @{ idList = $inProgressListId } | Out-Null
      $movedToInProgress++
    }
  }
}

Write-Host ("Board: {0}" -f $board.url)
Write-Host ("Priority labels updated: {0}" -f $priorityUpdated)
Write-Host ("Due dates updated: {0}" -f $dueUpdated)
Write-Host ("Week 1 moved to Ready: {0}" -f $movedToReady)
Write-Host ("Week 1 moved to In Progress: {0}" -f $movedToInProgress)
