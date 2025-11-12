# Test Document API
# UPDATE THE PORT NUMBER BELOW TO MATCH YOUR APPLICATION

$port = 5000  # Change this to your actual port
$url = "http://localhost:$port/api/Documents"

$body = @{
    OrderId = 1
    Name = "Test Document"
    FilePath = "/test/path.pdf"
} | ConvertTo-Json

Write-Host "Testing POST to: $url"
Write-Host "Body: $body"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success! Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error occurred!"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
}
