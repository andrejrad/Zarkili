param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [Parameter(Mandatory = $true)]
  [string]$ApiToken,

  [Parameter(Mandatory = $false)]
  [string]$BoardShortId = "3Y35226h",

  [Parameter(Mandatory = $false)]
  [int]$WipLimit = 5
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

function Trello-Put {
  param([string]$Path, [hashtable]$Params)
  Invoke-RestMethod -Method Put -Uri (New-TrelloUrl -Path $Path -Params $Params)
}

$board = Trello-Get -Path "boards/$BoardShortId" -Params @{ fields = "id,name,url" }
$lists = Trello-Get -Path "boards/$($board.id)/lists" -Params @{ fields = "id,name"; filter = "open" }
$labels = Trello-Get -Path "boards/$($board.id)/labels" -Params @{ fields = "id,name"; limit = "1000" }
$cards = Trello-Get -Path "boards/$($board.id)/cards" -Params @{ fields = "id,name,desc,idList,idLabels,dateLastActivity"; filter = "open" }

$listById = @{}
$listByName = @{}
foreach ($l in $lists) {
  $listById[$l.id] = $l.name
  $listByName[$l.name] = $l.id
}

$labelById = @{}
foreach ($lb in $labels) {
  $labelById[$lb.id] = $lb.name
}

$activeLanes = @("Ready", "In Progress", "Blocked", "Review and QA")
$ownerLines = @(
  "Owner: @andre",
  "Copilot: @copilot"
)

$ownersUpdated = 0
foreach ($c in $cards) {
  $lane = $listById[$c.idList]
  if ($activeLanes -notcontains $lane) { continue }

  $desc = [string]$c.desc
  $hasOwner = $desc -match "(?im)^Owner:\s+@andre\s*$"
  $hasCopilot = $desc -match "(?im)^Copilot:\s+@copilot\s*$"

  if (-not ($hasOwner -and $hasCopilot)) {
    $newHeader = ($ownerLines -join "`n")
    $newDesc = if ([string]::IsNullOrWhiteSpace($desc)) { $newHeader } else { "$newHeader`n`n$desc" }
    Trello-Put -Path "cards/$($c.id)" -Params @{ desc = $newDesc } | Out-Null
    $ownersUpdated++
  }
}

$inProgressId = $null
$readyId = $null
if ($listByName.ContainsKey("In Progress")) { $inProgressId = $listByName["In Progress"] }
if ($listByName.ContainsKey("Ready")) { $readyId = $listByName["Ready"] }

$movedBackToReady = 0
if ($inProgressId -and $readyId) {
  $inProgressCards = @($cards | Where-Object { $_.idList -eq $inProgressId })

  if ($inProgressCards.Count -gt $WipLimit) {
    $ranked = $inProgressCards | ForEach-Object {
      $priority = 3
      foreach ($lid in $_.idLabels) {
        $lname = $labelById[$lid]
        if ($lname -eq "P0") { $priority = 1; break }
        if ($lname -eq "P1") { $priority = [Math]::Min($priority, 2) }
      }

      [PSCustomObject]@{
        Card = $_
        PriorityRank = $priority
      }
    }

    $keep = @($ranked | Sort-Object PriorityRank, @{ Expression = { $_.Card.dateLastActivity }; Descending = $true } | Select-Object -First $WipLimit)
    $keepIds = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($k in $keep) { [void]$keepIds.Add($k.Card.id) }

    $toMove = @($inProgressCards | Where-Object { -not $keepIds.Contains($_.id) })
    foreach ($mv in $toMove) {
      Trello-Put -Path "cards/$($mv.id)" -Params @{ idList = $readyId } | Out-Null
      $movedBackToReady++
    }
  }
}

Write-Host ("Board: {0}" -f $board.url)
Write-Host ("Owner placeholders added: {0}" -f $ownersUpdated)
Write-Host ("Moved from In Progress to Ready for WIP: {0}" -f $movedBackToReady)
Write-Host ("Configured WIP limit: {0}" -f $WipLimit)
