# Setup Script for Windows Server (AWS EC2 or Azure VM)
# Run this script on your Windows Server instance to prepare it for ASP.NET Core deployment

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Windows Server Setup for ASP.NET Core" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Install IIS
Write-Host "Installing IIS..." -ForegroundColor Yellow
Install-WindowsFeature -name Web-Server -IncludeManagementTools
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install IIS!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ IIS installed" -ForegroundColor Green

# Install ASP.NET Core components for IIS
Write-Host ""
Write-Host "Installing required IIS features..." -ForegroundColor Yellow
Install-WindowsFeature Web-Asp-Net45
Install-WindowsFeature Web-Net-Ext45
Install-WindowsFeature Web-ISAPI-Ext
Install-WindowsFeature Web-ISAPI-Filter
Write-Host "✓ IIS features installed" -ForegroundColor Green

# Download and install .NET 8.0 Hosting Bundle
Write-Host ""
Write-Host "Downloading .NET 8.0 Hosting Bundle..." -ForegroundColor Yellow
$dotnetHostingUrl = "https://download.visualstudio.microsoft.com/download/pr/751d3fcd-72db-4da2-b8d0-709c19442225/ea6cea7e0a4308a75f18e7ccb3a2c8de/dotnet-hosting-8.0.11-win.exe"
$dotnetInstallerPath = "$env:TEMP\dotnet-hosting.exe"

try {
    Invoke-WebRequest -Uri $dotnetHostingUrl -OutFile $dotnetInstallerPath
    Write-Host "✓ Download complete" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Installing .NET 8.0 Hosting Bundle..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    Start-Process -FilePath $dotnetInstallerPath -ArgumentList "/quiet", "/install", "/norestart" -Wait
    Write-Host "✓ .NET 8.0 Hosting Bundle installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to download/install .NET Hosting Bundle!" -ForegroundColor Red
    Write-Host "Please download manually from: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
}

# Download and install URL Rewrite Module
Write-Host ""
Write-Host "Downloading IIS URL Rewrite Module..." -ForegroundColor Yellow
$urlRewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
$urlRewritePath = "$env:TEMP\urlrewrite.msi"

try {
    Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $urlRewritePath
    Write-Host "✓ Download complete" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Installing URL Rewrite Module..." -ForegroundColor Yellow
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $urlRewritePath, "/quiet", "/norestart" -Wait
    Write-Host "✓ URL Rewrite Module installed" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Failed to install URL Rewrite Module" -ForegroundColor Yellow
    Write-Host "You can install it manually if needed" -ForegroundColor Yellow
}

# Configure Windows Firewall
Write-Host ""
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
Write-Host "✓ Firewall rules configured" -ForegroundColor Green

# Create application directory
Write-Host ""
Write-Host "Creating application directory..." -ForegroundColor Yellow
$appPath = "C:\inetpub\wwwroot\skaiciuokle"
if (-not (Test-Path $appPath)) {
    New-Item -Path $appPath -ItemType Directory -Force | Out-Null
    Write-Host "✓ Directory created: $appPath" -ForegroundColor Green
} else {
    Write-Host "✓ Directory already exists: $appPath" -ForegroundColor Green
}

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Create Application Pool
Write-Host ""
Write-Host "Creating IIS Application Pool..." -ForegroundColor Yellow
$appPoolName = "SkaiciuokleAppPool"
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Remove-WebAppPool -Name $appPoolName
}
New-WebAppPool -Name $appPoolName
Set-ItemProperty "IIS:\AppPools\$appPoolName" -name "managedRuntimeVersion" -value ""
Write-Host "✓ Application Pool created" -ForegroundColor Green

# Create Website
Write-Host ""
Write-Host "Creating IIS Website..." -ForegroundColor Yellow
$siteName = "Skaiciuokle"
if (Test-Path "IIS:\Sites\$siteName") {
    Remove-Website -Name $siteName
}
# Stop default website to free up port 80
Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

New-Website -Name $siteName -Port 80 -PhysicalPath $appPath -ApplicationPool $appPoolName
Write-Host "✓ Website created" -ForegroundColor Green

# Set permissions
Write-Host ""
Write-Host "Setting directory permissions..." -ForegroundColor Yellow
$acl = Get-Acl $appPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl $appPath $acl
Write-Host "✓ Permissions configured" -ForegroundColor Green

# Restart IIS
Write-Host ""
Write-Host "Restarting IIS..." -ForegroundColor Yellow
iisreset
Write-Host "✓ IIS restarted" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy your application files to: $appPath" -ForegroundColor White
Write-Host "2. Update appsettings.Production.json with your database connection" -ForegroundColor White
Write-Host "3. Test your application by visiting: http://localhost" -ForegroundColor White
Write-Host "4. Configure SSL certificate for HTTPS (recommended)" -ForegroundColor White
Write-Host ""
Write-Host "Server is ready for deployment!" -ForegroundColor Green
Write-Host ""
