$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$base = 'http://localhost:5020'
$client = 'http://localhost:8090'
# Unique identities per run so the script is re-runnable against a stack whose
# MongoDB volume already holds earlier smoke users.
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email1 = "smoke-$stamp@example.com"
$email2 = "smoke2-$stamp@example.com"
function Status($label, $method, $url, $body = $null, $auth = $null) {
  try {
    $headers = @{}
    if ($auth) { $headers['Authorization'] = "Bearer $auth" }
    $params = @{ Uri = $url; Method = $method; Headers = $headers; UseBasicParsing = $true }
    if ($body -ne $null) { $params['ContentType'] = 'application/json'; $params['Body'] = ($body | ConvertTo-Json -Compress) }
    $r = Invoke-WebRequest @params
    Write-Output ("{0} => {1}" -f $label, $r.StatusCode)
    return $r
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Output ("{0} => {1} (ERR)" -f $label, $code)
    return $null
  }
}

# 1 health
Status 'server /health' 'Get' "$base/health"

# 2 register
$reg = Invoke-RestMethod -Uri "$base/api/v1/auth/register" -Method Post -ContentType 'application/json' -Body (@{name='Smoke User';email=$email1;password='password123'} | ConvertTo-Json)
Write-Output ("register success=" + $reg.success + " hasToken=" + [bool]$reg.token)
$t1 = $reg.token; $rt1 = $reg.refreshToken

# 3 login
$log = Invoke-RestMethod -Uri "$base/api/v1/auth/login" -Method Post -ContentType 'application/json' -Body (@{email=$email1;password='password123'} | ConvertTo-Json)
Write-Output ("login success=" + $log.success)

# second user for ownership
$u2 = Invoke-RestMethod -Uri "$base/api/v1/auth/register" -Method Post -ContentType 'application/json' -Body (@{name='Smoke Two';email=$email2;password='password123'} | ConvertTo-Json)

# 4 refresh + replay
$ref = Invoke-RestMethod -Uri "$base/api/v1/auth/refresh" -Method Post -ContentType 'application/json' -Body (@{refreshToken=$rt1} | ConvertTo-Json)
Write-Output ("refresh success=" + $ref.success)
$rt1New = $ref.refreshToken
Status 'refresh replay(old)' 'Post' "$base/api/v1/auth/refresh" @{refreshToken=$rt1}

# 5 AI (authenticated, deterministic -> ai service)
$ai = Invoke-RestMethod -Uri "$base/api/v1/ai/resume-analysis" -Method Post -Headers @{Authorization="Bearer $t1"} -ContentType 'application/json' -Body (@{resume_text='Experienced software engineer with Python, JavaScript, SQL and database experience. Built APIs and led engineering teams. Strong problem solving and communication.';target_role='Software Engineer'} | ConvertTo-Json)
Write-Output ("ai ats_score=" + $ai.ats_score + " keys=" + $ai.keywords_detected.Count)

# 6 ownership: user1 creates resume, user2 must be blocked
$res = Invoke-RestMethod -Uri "$base/api/resumes" -Method Post -Headers @{Authorization="Bearer $t1"} -ContentType 'application/json' -Body (@{title='My Resume';filename='r.pdf'} | ConvertTo-Json)
$rid = $res.data._id
$ownGet = Invoke-WebRequest -Uri "$base/api/resumes/$rid" -Headers @{Authorization="Bearer $t1"} -UseBasicParsing
Write-Output ("owner get own => " + $ownGet.StatusCode)
Status 'other-user get (IDOR)' 'Get' "$base/api/resumes/$rid" $null $u2.token
Status 'other-user delete (IDOR)' 'Delete' "$base/api/resumes/$rid" $null $u2.token

# 7 rate limit: burst auth attempts until 429 seen
$got429 = $false
for ($i=0; $i -lt 26; $i++) {
  try {
    Invoke-WebRequest -Uri "$base/api/v1/auth/login" -Method Post -ContentType 'application/json' -Body (@{email="burst$i@example.com";password='password123'} | ConvertTo-Json) -UseBasicParsing | Out-Null
  } catch {
    if ([int]$_.Exception.Response.StatusCode -eq 429) { $got429 = $true; break }
  }
}
Write-Output ("auth rate-limit 429 seen = " + $got429)

# 8 frontend
$fe = Invoke-WebRequest -Uri "$client/" -UseBasicParsing
Write-Output ("frontend '/' => " + $fe.StatusCode + " html=" + ($fe.Content -match 'CareerPilot'))
$feh = Invoke-WebRequest -Uri "$client/health" -UseBasicParsing
Write-Output ("frontend /health proxy => " + $feh.StatusCode)
Write-Output 'SMOKE_DONE'