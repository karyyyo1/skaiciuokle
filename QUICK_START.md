# Quick Start - Cloud Deployment

## 🚀 Fastest Way to Deploy (Azure - Recommended)

### Prerequisites
- Azure account (free tier available)
- Azure CLI installed: `winget install Microsoft.AzureCLI`

### Deploy in 5 Minutes

1. **Open PowerShell in project root**

2. **Run the deployment script:**
```powershell
.\deploy-to-azure.ps1 -ResourceGroupName "skaiciuokle-rg" -AppServiceName "skaiciuokle-app" -Location "westeurope"
```

3. **Done!** Your app will be at: `https://skaiciuokle-app.azurewebsites.net`

---

## 📋 All Deployment Options

### Option 1: Azure App Service (Windows) ⭐ EASIEST
- **Time**: 5-10 minutes
- **Difficulty**: Easy
- **Cost**: ~$25/month
- **Script**: `deploy-to-azure.ps1`
- **Guide**: See `CLOUD_DEPLOYMENT_GUIDE.md` - Option 1

**Quick Command:**
```powershell
.\deploy-to-azure.ps1 -ResourceGroupName "my-rg" -AppServiceName "my-app" -Location "westeurope"
```

---

### Option 2: AWS EC2 Windows Server
- **Time**: 30-60 minutes
- **Difficulty**: Medium
- **Cost**: ~$30/month
- **Setup Script**: `setup-windows-server.ps1`
- **Deploy Script**: `deploy-to-aws.ps1`
- **Guide**: See `CLOUD_DEPLOYMENT_GUIDE.md` - Option 2

**Steps:**
1. Launch Windows Server EC2 instance
2. RDP into the instance
3. Run `setup-windows-server.ps1` on the server
4. Build locally: `.\deploy-to-aws.ps1 -EC2InstanceIP "x.x.x.x" -PemKeyPath "key.pem"`
5. Copy deploy.zip to EC2 and extract

---

### Option 3: Google Cloud Compute Engine (Windows)
- **Time**: 30-60 minutes
- **Difficulty**: Medium
- **Cost**: ~$31/month
- **Guide**: See `CLOUD_DEPLOYMENT_GUIDE.md` - Option 3

---

## 🗄️ Database Setup

### Azure Database for MySQL (Recommended for Azure)
```powershell
az mysql flexible-server create `
  --resource-group skaiciuokle-rg `
  --name skaiciuokle-mysql `
  --location westeurope `
  --admin-user myadmin `
  --admin-password "YourPassword123!" `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --public-access 0.0.0.0 `
  --storage-size 32 `
  --version 8.0
```

### AWS RDS for MySQL (Recommended for AWS)
```powershell
aws rds create-db-instance `
  --db-instance-identifier skaiciuokle-db `
  --db-instance-class db.t3.micro `
  --engine mysql `
  --master-username admin `
  --master-user-password "YourPassword123!" `
  --allocated-storage 20
```

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `CLOUD_DEPLOYMENT_GUIDE.md` | Complete deployment documentation |
| `deploy-to-azure.ps1` | Automated Azure deployment |
| `deploy-to-aws.ps1` | AWS deployment helper |
| `setup-windows-server.ps1` | Windows Server setup script |
| `azure-pipelines.yml` | Azure DevOps CI/CD |
| `.github/workflows/deploy-azure.yml` | GitHub Actions CI/CD |
| `appsettings.Production.json` | Production configuration |
| `web.config` | IIS configuration |

---

## ⚡ CI/CD Setup

### GitHub Actions (Automated Deployments)

1. **Get Azure publish profile:**
```powershell
az webapp deployment list-publishing-profiles `
  --name skaiciuokle-app `
  --resource-group skaiciuokle-rg `
  --xml
```

2. **Add to GitHub Secrets:**
   - Go to: Repository → Settings → Secrets → Actions
   - Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste the XML from step 1

3. **Push to main branch** - Automatic deployment! 🎉

---

## 🔍 Troubleshooting

### App won't start
- Check connection string in Azure Portal
- Review logs in Azure Portal → Your App → Log stream
- Verify .NET 8.0 runtime is installed (for self-hosted)

### Database connection fails
- Check firewall rules allow your app
- Verify connection string format
- Test connection from Azure Cloud Shell

### 502 Bad Gateway
- Application pool stopped - restart it
- Check web.config is correct
- Review application logs

---

## 💡 Pro Tips

1. **Use Azure for simplest deployment** - No server management needed
2. **Always use managed databases** - Don't self-host MySQL unless necessary
3. **Enable HTTPS** - It's free with Azure/AWS
4. **Set up CI/CD** - Deploy on every push to main
5. **Monitor your app** - Use Application Insights (Azure) or CloudWatch (AWS)

---

## 📞 Need Help?

- Full guide: `CLOUD_DEPLOYMENT_GUIDE.md`
- Azure docs: https://docs.microsoft.com/azure
- AWS docs: https://docs.aws.amazon.com

---

**Recommended for beginners:** Start with Azure App Service using `deploy-to-azure.ps1` 🚀
