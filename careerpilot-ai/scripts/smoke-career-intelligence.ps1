<#
  Career Digital Twin + Career Intelligence closed-loop smoke test.

  Runs against a DEPLOYED stack (docker compose) or a local dev server and
  asserts the real HTTP contract end to end:

    register -> authenticated twin read (auto-provision) -> evidence update
    -> career events -> snapshots -> timeline -> progress -> career match v2
    -> next-best-action -> v1.1 AI career intelligence endpoints,
    plus ownership (IDOR), mass-assignment and validation rejection.

  Usage:
    pwsh -File scripts/smoke-career-intelligence.ps1
    pwsh -File scripts/smoke-career-intelligence.ps1 -Base http://localhost:5020

  Exit code 0 = every check passed; 1 = at least one check failed.
#>
param([string]$Base = 'http://localhost:5020')

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$script:passed = 0
$script:failed = 0
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email1 = "ci-smoke-1-$stamp@example.com"
$email2 = "ci-smoke-2-$stamp@example.com"
$password = 'password123'

function Check {
  param([string]$Label, [bool]$Condition, [string]$Detail = '')
  if ($Condition) {
    $script:passed++
    Write-Output ("PASS  {0}" -f $Label)
  } else {
    $script:failed++
    Write-Output ("FAIL  {0} {1}" -f $Label, $Detail)
  }
}

function Api {
  param(
    [string]$Method,
    [string]$Path,
    $Body = $null,
    [string]$Token = $null
  )
  $headers = @{}
  if ($Token) { $headers['Authorization'] = "Bearer $Token" }
  $params = @{ Uri = "$Base$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true }
  if ($null -ne $Body) {
    $params['ContentType'] = 'application/json'
    $params['Body'] = ($Body | ConvertTo-Json -Depth 8 -Compress)
  }
  try {
    $r = Invoke-WebRequest @params
    $json = $null
    try { $json = $r.Content | ConvertFrom-Json } catch { }
    return [pscustomobject]@{ status = [int]$r.StatusCode; body = $json }
  } catch {
    $code = 0
    $resp = $_.Exception.Response
    if ($resp) { try { $code = [int]$resp.StatusCode } catch { $code = -1 } }
    $text = $_.ErrorDetails.Message
    if (-not $text -and $resp) {
      try { $text = (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch { }
    }
    $json = $null
    if ($text) { try { $json = $text | ConvertFrom-Json } catch { } }
    return [pscustomobject]@{ status = $code; body = $json }
  }
}

$EVIDENCE = @(
  @{ source = 'user-provided'; ref = 'project:payments-api'; weight = 0.8 },
  @{ source = 'externally-verified'; ref = 'cert:aws'; weight = 0.9 }
)

# --- health -----------------------------------------------------------------
$health = Api Get '/health'
Check 'server /health returns 200' ($health.status -eq 200) "status=$($health.status)"

# --- authentication ---------------------------------------------------------
$reg1 = Api Post '/api/v1/auth/register' @{ name = 'Smoke One'; email = $email1; password = $password }
Check 'register user 1 -> 201' ($reg1.status -eq 201) "status=$($reg1.status)"
$token1 = $reg1.body.token

$reg2 = Api Post '/api/v1/auth/register' @{ name = 'Smoke Two'; email = $email2; password = $password }
Check 'register user 2 -> 201' ($reg2.status -eq 201) "status=$($reg2.status)"
$token2 = $reg2.body.token

$login = Api Post '/api/v1/auth/login' @{ email = $email1; password = $password }
Check 'login -> 200' ($login.status -eq 200) "status=$($login.status)"

$anon = Api Get '/api/v1/career-twin'
Check 'career twin requires auth (401)' ($anon.status -eq 401) "status=$($anon.status)"

# --- twin provisioning + evidence loop --------------------------------------
$twin0 = Api Get '/api/v1/career-twin' $null $token1
Check 'twin auto-provisions on first read (200)' ($twin0.status -eq 200) "status=$($twin0.status)"
Check 'auto-provisioned twin starts at version 1' ($twin0.body.data.version -eq 1) "version=$($twin0.body.data.version)"

$update1 = Api Put '/api/v1/career-twin' @{
  identity    = @{ fullName = 'Smoke One'; headline = 'Backend Engineer'; currentLevel = 'junior' }
  targetRoles = @('Data Scientist')
  skills      = @(
    @{ name = 'python'; proficiency = 'advanced'; confidence = 0.8; evidence = $EVIDENCE },
    @{ name = 'sql'; proficiency = 'intermediate'; confidence = 0.6; evidence = @(@{ source = 'user-provided'; weight = 0.6 }) }
  )
} $token1
Check 'twin evidence update -> 200' ($update1.status -eq 200) "status=$($update1.status)"
Check 'update increments version to 2' ($update1.body.data.version -eq 2) "version=$($update1.body.data.version)"
Check 'update records career events' ($update1.body.meta.eventsRecorded -ge 1) "events=$($update1.body.meta.eventsRecorded)"
Check 'evidence strength recomputed from evidence only' ($update1.body.data.derived.evidenceStrength -gt 0) "strength=$($update1.body.data.derived.evidenceStrength)"

$read1 = Api Get '/api/v1/career-twin' $null $token1
Check 'twin read back with both skills' ($read1.body.data.skills.Count -eq 2) "skills=$($read1.body.data.skills.Count)"

$massAssign = Api Put '/api/v1/career-twin' @{ user = '507f1f77bcf86cd799439011'; version = 99 } $token1
Check 'mass assignment rejected (400)' ($massAssign.status -eq 400) "status=$($massAssign.status)"

$update2 = Api Put '/api/v1/career-twin' @{
  skills = @(
    @{ name = 'python'; proficiency = 'advanced'; confidence = 0.8; evidence = $EVIDENCE },
    @{ name = 'sql'; proficiency = 'intermediate'; confidence = 0.6; evidence = @(@{ source = 'user-provided'; weight = 0.6 }) },
    @{ name = 'docker'; proficiency = 'beginner'; confidence = 0.5; evidence = @(@{ source = 'system-derived'; weight = 0.7 }) }
  )
} $token1
Check 'second evidence update -> 200 (version 3)' (($update2.status -eq 200) -and ($update2.body.data.version -eq 3)) "status=$($update2.status) version=$($update2.body.data.version)"

$timeline = Api Get '/api/v1/career-twin/timeline?limit=100' $null $token1
Check 'timeline returns recorded events' ($timeline.status -eq 200 -and $timeline.body.data.count -ge 2) "count=$($timeline.body.data.count)"

$clamped = Api Get '/api/v1/career-twin/timeline?limit=9999' $null $token1
Check 'timeline limit is clamped to 100' ($clamped.status -eq 200 -and $clamped.body.data.count -le 100) "count=$($clamped.body.data.count)"

$progress = Api Get '/api/v1/career-twin/progress' $null $token1
Check 'progress compares baseline and current snapshots' ($progress.status -eq 200 -and $progress.body.data.status -eq 'ok') "status=$($progress.body.data.status)"
Check 'progress reports skill growth (+1)' ($progress.body.data.change.skillCount -eq 1) "change=$($progress.body.data.change.skillCount)"
Check 'progress reports evidence growth' ($progress.body.data.change.evidenceStrength -ne 0) "change=$($progress.body.data.change.evidenceStrength)"

$match = Api Post '/api/v1/career-twin/career-match' @{ targetRole = 'Data Scientist' } $token1
Check 'twin-driven career match v2 -> 200' ($match.status -eq 200) "status=$($match.status)"
Check 'career match returns explainable dimensions' ($match.body.data.dimensions.Count -ge 3) "dimensions=$($match.body.data.dimensions.Count)"
Check 'career match is versioned against the twin' ($match.body.data.twinVersion -eq 3) "twinVersion=$($match.body.data.twinVersion)"

$nba = Api Get '/api/v1/career-twin/next-best-action' $null $token1
Check 'next-best-action -> 200' ($nba.status -eq 200) "status=$($nba.status)"

$export = Api Get '/api/v1/career-twin/export' $null $token1
Check 'twin export -> 200' ($export.status -eq 200) "status=$($export.status)"

# --- ownership / IDOR -------------------------------------------------------
$twin2 = Api Get '/api/v1/career-twin' $null $token2
Check 'second user gets their own empty twin' (($twin2.status -eq 200) -and ($twin2.body.data.skills.Count -eq 0)) "skills=$($twin2.body.data.skills.Count)"

$timeline2 = Api Get '/api/v1/career-twin/timeline?limit=100' $null $token2
# User 2's timeline may only contain their OWN provisioning event, never user 1's
# skill/target events.
Check 'second user timeline contains only their own events' (($timeline2.body.data.count -eq 1) -and ($timeline2.body.data.events[0].type -eq 'twin_created')) "count=$($timeline2.body.data.count) type=$($timeline2.body.data.events[0].type)"

$match2 = Api Post '/api/v1/career-twin/career-match' @{ targetRole = 'Data Scientist' } $token2
Check 'second user cannot match against user 1 evidence (400)' ($match2.status -eq 400) "status=$($match2.status)"

$delete2 = Api Delete '/api/v1/career-twin' $null $token2
Check 'second user delete only affects their own twin (200)' ($delete2.status -eq 200) "status=$($delete2.status)"

$afterDelete = Api Get '/api/v1/career-twin' $null $token1
Check 'user 1 twin untouched by user 2 delete' ($afterDelete.body.data.skills.Count -eq 3) "skills=$($afterDelete.body.data.skills.Count)"

# --- v1.1 AI career intelligence surface (through the Node gateway) ---------
$resumeText = 'Senior software engineer with 6 years of experience building Python, JavaScript and SQL systems. Built a payments API with FastAPI, PostgreSQL and Docker. AWS certified.'
$jdText = 'We require a Python developer with SQL, Docker and AWS experience. Nice to have: Kubernetes and React. 3+ years of experience required.'
$evidence = @(@{ skill = 'python'; proficiency = 'advanced'; evidence_count = 2 })

$aiCases = @(
  @{ label = 'resume-intelligence'; path = '/api/v1/ai-career/resume-intelligence'; body = @{ resume_text = $resumeText; target_role = 'Software Engineer' } },
  @{ label = 'jd-intelligence'; path = '/api/v1/ai-career/jd-intelligence'; body = @{ job_description = $jdText; user_skills = @('python', 'sql') } },
  @{ label = 'career-path-explorer'; path = '/api/v1/ai-career/career-path-explorer'; body = @{ current_skills = @('python', 'sql'); target_domains = @('software-development'); experience_years = 2 } },
  @{ label = 'career-path-details'; path = '/api/v1/ai-career/career-path-details'; body = @{ path_id = 'backend'; current_skills = @('python', 'sql'); skill_evidence = $evidence } },
  @{ label = 'what-if-simulation'; path = '/api/v1/ai-career/what-if-simulation'; body = @{ target_career = 'Data Scientist'; current_skills = @('python', 'sql'); skill_evidence = @(@{ skill = 'python'; proficiency = 'intermediate'; evidence_count = 1 }); simulated_improvements = @(@{ type = 'skill_improvement'; skill = 'machine learning'; new_proficiency = 'advanced'; evidence_count = 2 }) } },
  @{ label = 'interview-intelligence'; path = '/api/v1/ai-career/interview-intelligence'; body = @{ target_role = 'Software Engineer'; current_skills = @('python'); interview_type = 'technical' } },
  @{ label = 'interview-questions-intelligent'; path = '/api/v1/ai-career/interview-questions-intelligent'; body = @{ target_role = 'Software Engineer'; current_skills = @('python', 'sql'); interview_type = 'technical' } }
)

foreach ($case in $aiCases) {
  $resp = Api Post $case.path $case.body $token1
  # A 502 here means the task has no provider endpoint mapping (gateway bug).
  Check "AI $($case.label) -> 200" ($resp.status -eq 200) "status=$($resp.status)"
}

$pathDetails = Api Post '/api/v1/ai-career/career-path-details' @{ path_id = 'backend'; current_skills = @('python', 'sql') } $token1
Check 'career-path-details resolves a career definition' ($pathDetails.body.career_definition.id -eq 'software-engineer') "career=$($pathDetails.body.career_definition.id)"

$aiAnon = Api Post '/api/v1/ai-career/career-path-explorer' @{ current_skills = @('python') }
Check 'AI career endpoints require auth (401)' ($aiAnon.status -eq 401) "status=$($aiAnon.status)"

$aiInjected = Api Post '/api/v1/ai-career/resume-intelligence' @{ resume_text = $resumeText; role = 'admin' } $token1
Check 'AI career endpoints reject unexpected fields (400)' ($aiInjected.status -eq 400) "status=$($aiInjected.status)"

# --- summary ----------------------------------------------------------------
Write-Output ''
Write-Output ("SMOKE_RESULT passed={0} failed={1}" -f $script:passed, $script:failed)
if ($script:failed -gt 0) { exit 1 }
Write-Output 'SMOKE_CAREER_INTELLIGENCE_DONE'