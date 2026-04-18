param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [Parameter(Mandatory = $true)]
  [string]$ApiToken,

  [Parameter(Mandatory = $false)]
  [string]$WorkspaceId,

  [Parameter(Mandatory = $false)]
  [string]$BoardName = "Zarkili Program Board"
)

$ErrorActionPreference = "Stop"

function Invoke-TrelloPost {
  param(
    [string]$Path,
    [hashtable]$Body
  )

  $baseParams = @{
    key   = $ApiKey
    token = $ApiToken
  }

  foreach ($k in $Body.Keys) {
    $baseParams[$k] = $Body[$k]
  }

  $query = ($baseParams.GetEnumerator() | ForEach-Object {
    "{0}={1}" -f [System.Uri]::EscapeDataString($_.Key), [System.Uri]::EscapeDataString([string]$_.Value)
  }) -join "&"

  $url = "https://api.trello.com/1/$Path`?$query"
  return Invoke-RestMethod -Method Post -Uri $url
}

function Add-Card {
  param(
    [string]$ListId,
    [string]$Name,
    [string]$Desc
  )

  Invoke-TrelloPost -Path "cards" -Body @{
    idList = $ListId
    name   = $Name
    desc   = $Desc
  } | Out-Null
}

Write-Host "Creating Trello board..."
$boardBody = @{
  name       = $BoardName
  defaultLists = "false"
}
if ($WorkspaceId) {
  $boardBody["idOrganization"] = $WorkspaceId
}
$board = Invoke-TrelloPost -Path "boards" -Body $boardBody

$laneNames = @(
  "Backlog",
  "Ready",
  "In Progress",
  "Blocked",
  "Review and QA",
  "Done"
)

$listIds = @{}
foreach ($lane in $laneNames) {
  $list = Invoke-TrelloPost -Path "lists" -Body @{
    idBoard = $board.id
    name    = $lane
    pos     = "bottom"
  }
  $listIds[$lane] = $list.id
}

$cards = @(
  @{ Lane = "Backlog"; Name = "B-001 Marketplace phase 2 hardening"; Desc = "Source: documentation/MARKETPLACE_SPECS.md\nTarget: Week 14-16" },
  @{ Lane = "Backlog"; Name = "B-002 AI copilot phase 2 expansions"; Desc = "Source: documentation/AI_FEATURES_SPECS.md\nTarget: Week 18-20" },
  @{ Lane = "Backlog"; Name = "B-003 Advanced loyalty campaigns and multipliers"; Desc = "Source: documentation/LOYALTY_FUNCTIONAL_SPEC_V1.md\nTarget: Post Week 8" },

  @{ Lane = "Ready"; Name = "R-001 Week 1 vertical slice kickoff"; Desc = "Source: documentation/MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md\nTarget: Week 1" },
  @{ Lane = "Ready"; Name = "R-002 Auth plus tenant context implementation"; Desc = "Source: documentation/DAY1_DEVELOPMENT_CHECKLIST.md\nTarget: Week 1" },
  @{ Lane = "Ready"; Name = "R-003 Firestore rules tenant isolation pass v1"; Desc = "Source: documentation/MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md\nTarget: Week 1" },
  @{ Lane = "Ready"; Name = "R-004 Salon onboarding flow v1"; Desc = "Source: documentation/SALON_ONBOARDING_SPECS.md\nTarget: Week 6-8" },
  @{ Lane = "Ready"; Name = "R-005 Client onboarding flow v1"; Desc = "Source: documentation/CLIENT_ONBOARDING.md\nTarget: Week 6-8" },
  @{ Lane = "Ready"; Name = "R-006 Free trial gating flow"; Desc = "Source: documentation/FREE_TRIAL_SPECS.md\nTarget: Week 13" },
  @{ Lane = "Ready"; Name = "R-007 Stripe billing integration v1"; Desc = "Source: documentation/PAYMENT_FEATURE_SPECS.md\nTarget: Week 14" },
  @{ Lane = "Ready"; Name = "R-008 Loyalty implementation v1"; Desc = "Source: documentation/LOYALTY_FUNCTIONAL_SPEC_V1.md\nTarget: Week 8" },

  @{ Lane = "Done"; Name = "D-001 Day 0 project bootstrap complete"; Desc = "Source: documentation/DAY1_DEVELOPMENT_CHECKLIST.md\nCompleted: 2026-04-16" },
  @{ Lane = "Done"; Name = "D-002 Development and production Firebase environments configured"; Desc = "Source: documentation/MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md\nCompleted: 2026-04-16" },
  @{ Lane = "Done"; Name = "D-003 Expo SDK upgraded to 54 and startup scripts stabilized"; Desc = "Source: documentation/MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md\nCompleted: 2026-04-17" }
)

Write-Host "Creating cards..."
foreach ($card in $cards) {
  Add-Card -ListId $listIds[$card.Lane] -Name $card.Name -Desc $card.Desc
}

Write-Host "Done."
Write-Host ("Board created: {0}" -f $board.url)
