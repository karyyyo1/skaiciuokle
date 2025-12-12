# Cloud Deployment Guide - Windows Server

This guide covers deploying your ASP.NET Core 8.0 application to cloud platforms using Windows servers.

## Table of Contents
- [Option 1: Azure App Service (Windows) - Recommended](#option-1-azure-app-service-windows)
- [Option 2: AWS EC2 Windows Server](#option-2-aws-ec2-windows-server)
- [Option 3: Google Cloud Compute Engine (Windows)](#option-3-google-cloud-compute-engine-windows)

---

## Option 1: Azure App Service (Windows) - Recommended ⭐

Azure App Service is the easiest way to deploy ASP.NET Core applications on Windows with built-in scaling, SSL, and deployment slots.

### Prerequisites
- Azure account ([Free tier available](https://azure.microsoft.com/free/))
- Azure CLI installed or use Azure Portal
- .NET 8.0 SDK installed

### Step 1: Prepare Your Application

1. **Update Connection String for Production**
   - Add connection string in Azure Portal (more secure than appsettings)
   - Or use Azure Database for MySQL

2. **Add Production Configuration**
   ```bash
   # Already created in appsettings.Production.json
   ```

### Step 2: Deploy Using Azure CLI

```powershell
# Login to Azure
az login

# Create a resource group
az group create --name skaiciuokle-rg --location "West Europe"

# Create an App Service Plan (Windows, B1 tier)
az appservice plan create --name skaiciuokle-plan --resource-group skaiciuokle-rg --sku B1 --is-linux false

# Create the Web App
az webapp create --name skaiciuokle-app --resource-group skaiciuokle-rg --plan skaiciuokle-plan --runtime "DOTNET:8.0"

# Configure MySQL connection string (replace with your actual connection string)
az webapp config connection-string set --name skaiciuokle-app --resource-group skaiciuokle-rg --connection-string-type MySql --settings DefaultConnection="Server=your-mysql-server;Database=your-db;User=your-user;Password=your-password;"

# Publish your application
cd projektas
dotnet publish -c Release -o ./publish

# Deploy using ZIP
cd publish
Compress-Archive -Path * -DestinationPath ../deploy.zip -Force
cd ..
az webapp deployment source config-zip --resource-group skaiciuokle-rg --name skaiciuokle-app --src deploy.zip
```

### Step 3: Set Up Azure Database for MySQL (Recommended)

```powershell
# Create MySQL Flexible Server
az mysql flexible-server create --resource-group skaiciuokle-rg --name skaiciuokle-mysql --location "West Europe" --admin-user myadmin --admin-password "YourPassword123!" --sku-name Standard_B1ms --tier Burstable --public-access 0.0.0.0 --storage-size 32 --version 8.0

# Create database
az mysql flexible-server db create --resource-group skaiciuokle-rg --server-name skaiciuokle-mysql --database-name skaiciuokledb

# Get connection string
az mysql flexible-server show-connection-string --server-name skaiciuokle-mysql
```

### Step 4: Configure Firewall and SSL

```powershell
# Allow Azure services to access MySQL
az mysql flexible-server firewall-rule create --resource-group skaiciuokle-rg --name skaiciuokle-mysql --rule-name AllowAzure --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

# Enable HTTPS only
az webapp update --name skaiciuokle-app --resource-group skaiciuokle-rg --https-only true
```

### Your application will be available at:
`https://skaiciuokle-app.azurewebsites.net`

---

## Option 2: AWS EC2 Windows Server

Deploy to a Windows Server instance on AWS with full control over the server.

### Prerequisites
- AWS account
- AWS CLI installed
- Remote Desktop client

### Step 1: Launch Windows Server EC2 Instance

1. **Go to AWS EC2 Console**
2. **Launch Instance:**
   - **AMI**: Windows Server 2022 Base
   - **Instance Type**: t3.small (minimum) or t3.medium (recommended)
   - **Storage**: 30 GB SSD
   - **Security Group**: Allow ports 80 (HTTP), 443 (HTTPS), 3389 (RDP)

3. **Download Key Pair** (.pem file) for RDP access

### Step 2: Connect to Windows Server

```powershell
# Get Windows password
aws ec2 get-password-data --instance-id i-1234567890abcdef0 --priv-launch-key your-key.pem

# Use Remote Desktop Connection
# Computer: <EC2-Public-IP>
# Username: Administrator
# Password: <from above command>
```

### Step 3: Set Up Windows Server

**On the EC2 Windows Server via RDP:**

```powershell
# Install .NET 8.0 Runtime
# Download from: https://dotnet.microsoft.com/download/dotnet/8.0/runtime
Invoke-WebRequest -Uri "https://download.visualstudio.microsoft.com/download/pr/..." -OutFile "dotnet-hosting.exe"
.\dotnet-hosting.exe /quiet /install

# Install IIS
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# Install URL Rewrite Module
Invoke-WebRequest -Uri "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi" -OutFile "urlrewrite.msi"
msiexec /i urlrewrite.msi /quiet

# Restart
Restart-Computer
```

### Step 4: Deploy Application

```powershell
# On your local machine, build the application
cd projektas
dotnet publish -c Release -o ./publish

# Copy files to EC2 (use WinSCP, FileZilla, or AWS S3)
# Example using SCP:
scp -i your-key.pem -r ./publish/* Administrator@<EC2-Public-IP>:C:\inetpub\wwwroot\

# On EC2 Server, create IIS site
New-WebAppPool -Name "SkaiciuokleAppPool"
Set-ItemProperty IIS:\AppPools\SkaiciuokleAppPool -name "managedRuntimeVersion" -value ""
New-Website -Name "Skaiciuokle" -Port 80 -PhysicalPath "C:\inetpub\wwwroot" -ApplicationPool "SkaiciuokleAppPool"
```

### Step 5: Set Up MySQL on AWS RDS

```powershell
# Create RDS MySQL instance
aws rds create-db-instance --db-instance-identifier skaiciuokle-db --db-instance-class db.t3.micro --engine mysql --master-username admin --master-user-password YourPassword123! --allocated-storage 20 --vpc-security-group-ids sg-xxxxxxxx

# Get endpoint
aws rds describe-db-instances --db-instance-identifier skaiciuokle-db --query 'DBInstances[0].Endpoint.Address'
```

### Step 6: Configure Application

Update `appsettings.Production.json` on the server with RDS connection string.

### Your application will be available at:
`http://<EC2-Public-IP>` or configure Route53 for custom domain

---

## Option 3: Google Cloud Compute Engine (Windows)

### Step 1: Create Windows VM Instance

```powershell
# Using Google Cloud Console or gcloud CLI
gcloud compute instances create skaiciuokle-vm --machine-type=e2-medium --image-family=windows-2022 --image-project=windows-cloud --boot-disk-size=50GB --zone=europe-west1-b

# Create firewall rules
gcloud compute firewall-rules create allow-http --allow tcp:80
gcloud compute firewall-rules create allow-https --allow tcp:443
```

### Step 2: Connect via RDP

```powershell
# Get RDP password
gcloud compute reset-windows-password skaiciuokle-vm --zone=europe-west1-b --user=admin
```

### Step 3: Follow Similar Steps as AWS EC2

Install .NET 8.0, IIS, and deploy your application.

---

## Database Options

### For Production, Choose One:

1. **Azure Database for MySQL** (if using Azure)
   - Fully managed
   - Automatic backups
   - Built-in monitoring
   - Best for Azure deployments

2. **AWS RDS for MySQL** (if using AWS)
   - Fully managed
   - Multi-AZ deployment
   - Automated backups
   - Best for AWS deployments

3. **Google Cloud SQL for MySQL** (if using GCP)
   - Fully managed
   - High availability
   - Automatic replication

4. **Self-hosted MySQL on Windows Server**
   - Full control
   - More maintenance required

---

## Post-Deployment Checklist

- [ ] Database connection string configured
- [ ] HTTPS/SSL certificate configured
- [ ] Firewall rules set up correctly
- [ ] Database migrations run
- [ ] Application logging configured
- [ ] Backup strategy in place
- [ ] Custom domain configured (optional)
- [ ] Environment variables set
- [ ] Health check endpoint tested
- [ ] Performance monitoring enabled

---

## Continuous Deployment (CI/CD)

### Azure DevOps Pipeline (azure-pipelines.yml)
See `azure-pipelines.yml` file in the repository.

### GitHub Actions
See `.github/workflows/deploy-azure.yml` file in the repository.

---

## Cost Estimates

### Azure (Monthly)
- App Service (B1): ~$13
- MySQL Flexible Server (B1ms): ~$12
- **Total: ~$25/month**

### AWS (Monthly)
- EC2 t3.small: ~$15
- RDS db.t3.micro: ~$15
- **Total: ~$30/month**

### Google Cloud (Monthly)
- Compute Engine e2-medium: ~$24
- Cloud SQL db-f1-micro: ~$7
- **Total: ~$31/month**

---

## Recommended Choice

**For easiest deployment:** Azure App Service (Windows)
- No server management
- Built-in CI/CD
- Automatic scaling
- Perfect for ASP.NET Core

**For full control:** AWS EC2 or Google Compute Engine
- Complete Windows Server access
- Custom configurations
- More setup required

---

## Support

For issues:
1. Check application logs
2. Verify connection strings
3. Check firewall rules
4. Review cloud platform status pages

Good luck with your deployment! 🚀
