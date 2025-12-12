# OAuth2 JWT Authentication Test Script
# This script tests the authentication endpoints

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://skaiciuokle.azurewebsites.net"
)

Write-Host "Testing OAuth2 JWT Authentication" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Register a new user
Write-Host "Test 1: Register New User" -ForegroundColor Green
Write-Host "POST $BaseUrl/api/auth/register"

$registerBody = @{
    username = "testuser_$(Get-Random -Maximum 10000)"
    email = "test_$(Get-Random -Maximum 10000)@example.com"
    password = "TestPassword123!"
    confirmPassword = "TestPassword123!"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json"
    
    Write-Host "✓ Registration successful!" -ForegroundColor Green
    Write-Host "  Username: $($registerResponse.username)" -ForegroundColor Gray
    Write-Host "  Email: $($registerResponse.email)" -ForegroundColor Gray
    Write-Host "  Role: $($registerResponse.role)" -ForegroundColor Gray
    Write-Host "  Token received: $($registerResponse.token.Substring(0, 50))..." -ForegroundColor Gray
    
    $token = $registerResponse.token
    $testEmail = ($registerBody | ConvertFrom-Json).email
    $testPassword = ($registerBody | ConvertFrom-Json).password
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Login with the created user
Write-Host "Test 2: Login" -ForegroundColor Green
Write-Host "POST $BaseUrl/api/auth/login"

$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($loginResponse.token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  Expires: $($loginResponse.expiration)" -ForegroundColor Gray
    
    $token = $loginResponse.token
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Get current user info (authenticated endpoint)
Write-Host "Test 3: Get Current User (Authenticated)" -ForegroundColor Green
Write-Host "GET $BaseUrl/api/auth/me"

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $meResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✓ Get current user successful!" -ForegroundColor Green
    Write-Host "  User ID: $($meResponse.id)" -ForegroundColor Gray
    Write-Host "  Username: $($meResponse.username)" -ForegroundColor Gray
    Write-Host "  Email: $($meResponse.email)" -ForegroundColor Gray
    Write-Host "  Role: $($meResponse.role)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Get current user failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Try to access protected endpoint without token
Write-Host "Test 4: Access Protected Endpoint Without Token (Should Fail)" -ForegroundColor Green
Write-Host "GET $BaseUrl/api/orders"

try {
    $ordersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/orders" `
        -Method Get `
        -ErrorAction Stop
    
    Write-Host "✗ Endpoint is NOT protected (this is a problem!)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✓ Correctly returned 401 Unauthorized" -ForegroundColor Green
    } else {
        Write-Host "? Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 5: Access protected endpoint with valid token
Write-Host "Test 5: Access Protected Endpoint With Token (Should Succeed)" -ForegroundColor Green
Write-Host "GET $BaseUrl/api/orders"

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $ordersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/orders" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✓ Successfully accessed protected endpoint!" -ForegroundColor Green
    Write-Host "  Response: $($ordersResponse.Count) orders found" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to access protected endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Try to access public endpoint (should work without auth)
Write-Host "Test 6: Access Public Endpoint (Should Work Without Auth)" -ForegroundColor Green
Write-Host "GET $BaseUrl/api/products"

try {
    $productsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/products" `
        -Method Get
    
    Write-Host "✓ Successfully accessed public endpoint!" -ForegroundColor Green
    Write-Host "  Response: $($productsResponse.Count) products found" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to access public endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Authentication Tests Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your JWT Token (save this for testing):" -ForegroundColor Yellow
Write-Host $token -ForegroundColor White
Write-Host ""
Write-Host "Use this token in your API requests:" -ForegroundColor Yellow
Write-Host "  Authorization: Bearer $token" -ForegroundColor Gray
