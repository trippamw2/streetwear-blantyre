$PROJECT_ID = "pxltbgfcwylnounuzszg"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bHRiZ2Zjd3lsbm91bnV6c3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTA0NDAsImV4cCI6MjA5MjU2NjQ0MH0.FpjKn6Xy_Yx-iyVt8YGiZHWf1Ru6saf0G95JCtioEDc"
$SQL_FILE = "$PSScriptRoot\supabase\migrations\20260424120000_all_tables.sql"

Write-Host "Reading migration SQL..."
$SQL = Get-Content $SQL_FILE -Raw -Encoding UTF8

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

Write-Host "Running migrations..."
try {
  $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers -TimeoutSec 120
  Write-Host "Success!"
  Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
  Write-Host "Error: $($_.Exception.Message)"
  $stream = $_.Exception.Response.GetResponseStream()
  $stream.Position = 0
  $reader = New-Object System.IO.StreamReader($stream)
  $errorBody = $reader.ReadToEnd()
  Write-Host "Response: $errorBody"
}