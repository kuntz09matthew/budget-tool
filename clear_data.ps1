# Clear existing budget data to load test data
$dataFile = "C:\Users\kuntz\Desktop\Budget Tool\server\budget_data.json"

if (Test-Path $dataFile) {
    Remove-Item $dataFile -Force
    Write-Host "✅ Deleted existing budget_data.json"
} else {
    Write-Host "ℹ️  No existing budget_data.json found"
}

Write-Host "✅ Ready to load test data. Restart the server to see new variable income examples!"
