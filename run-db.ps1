$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^VITE_(.+)=(.+)$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
}

$PROJECT_ID = "pxltbgfcwylnounuzszg"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bHRiZ2Zjd3lsbm91bnV6c3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTA0NDAsImV4cCI6MjA5MjU2NjQ0MH0.FpjKn6Xy_Yx-iyVt8YGiZHWf1Ru6saf0G95JCtioEDc"
$SQL = Get-Content "$PSScriptRoot\supabase\setup.sql" -Raw -Encoding UTF8

$body = @{
    query = $SQL
} | ConvertTo-Json -Depth 10

$headers = @{
    "apikey" = $ANON_KEY
    "Authorization" = "Bearer $ANON_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "params=representation"
}

$url = "https://$PROJECT_ID.supabase.co/rest/v1/rpc/exec_sql"

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers -TimeoutSec 60
    Write-Host "Success: Database created!"
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.Exception.Response)"
}