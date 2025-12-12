# PowerShell Script to Deploy ASP.NET Core App to Azure App Service on Windows
# Run this script from the project root directory

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "norwayeast",
    
    [Parameter(Mandatory=$false)]
    [string]$MySqlConnectionString = ""
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Azure Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking Azure CLI..." -ForegroundColor Yellow
$azCliInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCliInstalled) {
    Write-Host "ERROR: Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "Please install from: https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Azure CLI found" -ForegroundColor Green

# Login to Azure
Write-Host ""
Write-Host "Logging in to Azure..." -ForegroundColor Yellow
az login
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Azure login failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Logged in successfully" -ForegroundColor Green

# Create Resource Group
Write-Host ""
Write-Host "Creating Resource Group: $ResourceGroupName..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create resource group!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Resource Group created" -ForegroundColor Green

# Create App Service Plan (Windows, B1 tier)
Write-Host ""
Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
$appServicePlan = "$AppServiceName-plan"
az appservice plan create --name $appServicePlan --resource-group $ResourceGroupName --sku B1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create App Service Plan!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ App Service Plan created" -ForegroundColor Green

# Create Web App
Write-Host ""
Write-Host "Creating Web App: $AppServiceName..." -ForegroundColor Yellow
az webapp create --name $AppServiceName --resource-group $ResourceGroupName --plan $appServicePlan --runtime "DOTNET:8.0"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create Web App!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Web App created" -ForegroundColor Green

# Configure MySQL connection string if provided
if ($MySqlConnectionString -ne "") {
    Write-Host ""
    Write-Host "Configuring MySQL connection string..." -ForegroundColor Yellow
    az webapp config connection-string set --name $AppServiceName --resource-group $ResourceGroupName --connection-string-type MySql --settings DefaultConnection="$MySqlConnectionString"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Failed to set connection string. You can set it manually in Azure Portal." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Connection string configured" -ForegroundColor Green
    }
}

# Enable HTTPS only
Write-Host ""
Write-Host "Enabling HTTPS only..." -ForegroundColor Yellow
az webapp update --name $AppServiceName --resource-group $ResourceGroupName --https-only true
Write-Host "✓ HTTPS enforced" -ForegroundColor Green

# Build and Publish the application
Write-Host ""
Write-Host "Building application..." -ForegroundColor Yellow
Set-Location -Path "projektas"
dotnet publish -c Release -o ./publish
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build application!" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}
Write-Host "✓ Application built successfully" -ForegroundColor Green

# Create deployment package
Write-Host ""
Write-Host "Creating deployment package..." -ForegroundColor Yellow
Set-Location -Path "publish"
Compress-Archive -Path * -DestinationPath ../deploy.zip -Force
Set-Location -Path ".."
Write-Host "✓ Deployment package created" -ForegroundColor Green

# Deploy to Azure
Write-Host ""
Write-Host "Deploying to Azure..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $ResourceGroupName --name $AppServiceName --src deploy.zip
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}
Write-Host "✓ Deployment successful" -ForegroundColor Green

# Clean up
Write-Host ""
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path deploy.zip -Force
Remove-Item -Path publish -Recurse -Force
Set-Location -Path ".."
Write-Host "✓ Cleanup complete" -ForegroundColor Green

# Get the URL
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your application is available at:" -ForegroundColor Yellow
Write-Host "https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure your MySQL database connection string in Azure Portal if not done" -ForegroundColor White
Write-Host "2. Run database migrations" -ForegroundColor White
Write-Host "3. Test your application" -ForegroundColor White
Write-Host "4. Configure custom domain (optional)" -ForegroundColor White
Write-Host ""
