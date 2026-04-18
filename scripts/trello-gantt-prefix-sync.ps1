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

function Trello-Put {
  param([string]$Path, [hashtable]$Params)
  Invoke-RestMethod -Method Put -Uri (New-TrelloUrl -Path $Path -Params $Params)
}

function Get-WeekFromCard {
  param([object]$Card)

  if ($Card.due) {
    $due = [datetime]$Card.due
    $days = [int][Math]::Floor(($due.Date - $Week1StartDate.Date).TotalDays)
    if ($days -ge 0) {
      return [int][Math]::Floor($days / 7) + 1
    }
  }

  $text = "$($Card.name)`n$($Card.desc)"

  $m = [regex]::Match($text, 'Week\s*(\d+)\s*-\s*(\d+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($m.Success) { return [int]$m.Groups[1].Value }

  $m2 = [regex]::Match($text, 'Week\s*(\d+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($m2.Success) { return [int]$m2.Groups[1].Value }

  return 99
}

$categoryCode = @{
  "Architecture"  = "ARCH"
  "Backend"       = "BE"
  "Frontend"      = "FE"
  "Firebase"      = "FB"
  "Security"      = "SEC"
  "QA"            = "QA"
  "DevOps"        = "OPS"
  "Payments"      = "PAY"
  "Onboarding"    = "ONB"
  "Marketplace"   = "MKT"
  "AI"            = "AI"
  "Loyalty"       = "LOY"
  "Documentation" = "DOC"
  "General"       = "GEN"
}

Write-Host "Loading board, labels, and cards..."
$board = Trello-Get -Path "boards/$BoardShortId" -Params @{ fields = "id,name,url" }
$labels = Trello-Get -Path "boards/$($board.id)/labels" -Params @{ fields = "id,name"; limit = "1000" }
$cards = Trello-Get -Path "boards/$($board.id)/cards" -Params @{ fields = "id,name,desc,idLabels,due"; filter = "open" }

$labelById = @{}
foreach ($lb in $labels) { $labelById[$lb.id] = $lb.name }

$categoryNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($k in $categoryCode.Keys) {
  if ($k -ne "General") { [void]$categoryNames.Add($k) }
}

$seqByKey = @{}
$updated = 0
$skippedExisting = 0

foreach ($c in $cards) {
  if ($c.name -match '^\s*\[W\d{2}-[A-Z]{2,4}-\d{3}\]\s+') {
    $skippedExisting++
    continue
  }

  $category = "General"
  foreach ($lid in $c.idLabels) {
    $lname = $labelById[$lid]
    if ($lname -and $categoryNames.Contains($lname)) {
      $category = $lname
      break
    }
  }

  $code = $categoryCode[$category]
  if (-not $code) { $code = "GEN" }

  $week = Get-WeekFromCard -Card $c
  if ($week -lt 1) { $week = 99 }
  if ($week -gt 99) { $week = 99 }

  $bucket = "{0}-{1}" -f $week.ToString("00"), $code
  if (-not $seqByKey.ContainsKey($bucket)) {
    $seqByKey[$bucket] = 1
  } else {
    $seqByKey[$bucket] = [int]$seqByKey[$bucket] + 1
  }

  $seq = [int]$seqByKey[$bucket]
  $prefix = "[W{0}-{1}-{2}]" -f $week.ToString("00"), $code, $seq.ToString("000")
  $newName = "$prefix $($c.name)"

  if ($newName.Length -gt 160) {
    $allowed = 160 - ($prefix.Length + 1)
    if ($allowed -lt 12) { $allowed = 12 }
    $trimmed = $c.name
    if ($trimmed.Length -gt $allowed) {
      $trimmed = $trimmed.Substring(0, $allowed - 3) + "..."
    }
    $newName = "$prefix $trimmed"
  }

  Trello-Put -Path "cards/$($c.id)" -Params @{ name = $newName } | Out-Null
  $updated++
}

Write-Host ("Board: {0}" -f $board.url)
Write-Host ("Cards renamed with Gantt prefix: {0}" -f $updated)
Write-Host ("Cards already prefixed: {0}" -f $skippedExisting)
