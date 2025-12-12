# Deployment Update Guide - OAuth2 JWT Authentication

## Quick Deployment Steps for Azure

### Step 1: Update Azure Application Settings

1. Navigate to **Azure Portal** → **App Services** → **skaiciuokle**

2. Go to **Configuration** → **Application settings**

3. Add/Update the following settings:

   **JWT Secret Key** (CRITICAL - Security):
   ```
   Name: JwtSettings__SecretKey
   Value: <paste-your-generated-secret-key>
   ```

   Generate a secure key using PowerShell:
   ```powershell
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   ```

   **Connection String** (if not already set):
   ```
   Name: ConnectionStrings__DefaultConnection
   Value: Server=<your-mysql-server>;Database=skaiciuokle;User=<user>;Password=<password>;
   ```

4. Click **Save** and **Continue** when prompted

### Step 2: Deploy Updated Application

Option A - Using Azure CLI (Recommended):
```powershell
# Navigate to project directory
cd c:\Users\Dell\Desktop\unikas\7_pusm\Saitynai\skaiciuokle

# Build and publish
cd projektas
dotnet publish -c Release -o ./publish

# Deploy to Azure
cd ..
az webapp deployment source config-zip `
  --resource-group skaiciuokle-germany-rg `
  --name skaiciuokle `
  --src projektas/publish.zip
```

Option B - Using Visual Studio:
1. Right-click on `projektas` project
2. Select **Publish**
3. Choose your Azure profile
4. Click **Publish**

Option C - Using GitHub Actions (if configured):
1. Commit and push your changes
2. GitHub Actions will automatically deploy

### Step 3: Verify Deployment

1. Check application logs in Azure:
   ```
   Azure Portal → App Service → Log stream
   ```

2. Test the authentication endpoint:
   ```bash
   curl -X POST https://skaiciuokle.azurewebsites.net/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

### Step 4: Create Initial Admin User

Option A - Via API (Register then update role):
```bash
# 1. Register user
curl -X POST https://skaiciuokle.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "AdminPassword123!",
    "confirmPassword": "AdminPassword123!"
  }'

# 2. Update role in database to admin (role = 1)
```

Option B - Direct database update:
```sql
-- Connect to your MySQL database
UPDATE users SET role = 1 WHERE email = 'admin@example.com';
```

## Configuration Reference

### Environment Variables in Azure

Your deployed application will use these settings:

| Setting Name | Value | Required |
|-------------|-------|----------|
| `JwtSettings__SecretKey` | Your secret key (64+ chars) | **Yes** |
| `JwtSettings__Issuer` | `skaiciuokle-api` | No (has default) |
| `JwtSettings__Audience` | `skaiciuokle-client` | No (has default) |
| `JwtSettings__ExpirationMinutes` | `60` | No (has default) |
| `ConnectionStrings__DefaultConnection` | Your DB connection | **Yes** |

### CORS Configuration (if needed for frontend)

If you're calling the API from a web frontend, add CORS to `Program.cs`:

```csharp
// Add before builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("https://your-frontend-domain.com")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Add after app.UseRouting()
app.UseCors("AllowFrontend");
```

## Post-Deployment Checklist

- [ ] JWT secret key is set in Azure App Settings
- [ ] Database connection string is configured
- [ ] Application deployed successfully
- [ ] `/api/auth/login` endpoint responds
- [ ] `/api/auth/register` endpoint responds
- [ ] Initial admin user created
- [ ] Protected endpoints return 401 without token
- [ ] Protected endpoints work with valid token
- [ ] HTTPS is enforced
- [ ] Application Insights is logging (optional)

## Testing the Deployment

### 1. Test Registration
```bash
curl -X POST https://skaiciuokle.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'
```

Expected: 200 OK with token

### 2. Test Login
```bash
curl -X POST https://skaiciuokle.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

Expected: 200 OK with token

### 3. Test Protected Endpoint
```bash
# Without token (should fail)
curl https://skaiciuokle.azurewebsites.net/api/orders

# With token (should succeed)
curl https://skaiciuokle.azurewebsites.net/api/orders \
  -H "Authorization: Bearer <your-token-here>"
```

### 4. Test Public Endpoints
```bash
# Should work without authentication
curl https://skaiciuokle.azurewebsites.net/api/products
```

## Rollback Plan

If issues occur after deployment:

1. **Quick Fix**: Revert to previous deployment slot (if using slots)
2. **Full Rollback**: Deploy previous version from Git
3. **Emergency**: Stop the app service and investigate logs

## Monitoring

Monitor your application:

1. **Azure Portal** → **App Service** → **Monitoring**
2. Check **Log stream** for real-time logs
3. View **Metrics** for request/response data
4. Setup **Alerts** for failures

## Support

If you encounter issues:

1. Check Application Insights / Log Stream
2. Verify all configuration settings
3. Test database connectivity
4. Review the AUTHENTICATION_GUIDE.md for API usage

## Common Issues

### Issue: "JWT Secret Key is not configured"
**Solution**: Set `JwtSettings__SecretKey` in Azure App Settings

### Issue: 401 Unauthorized on all endpoints
**Solution**: Ensure token is included in Authorization header: `Bearer <token>`

### Issue: Can't login with existing users
**Solution**: Existing passwords need to be re-hashed. Users must re-register or reset passwords.

### Issue: Database connection error
**Solution**: Verify `ConnectionStrings__DefaultConnection` in Azure App Settings

## Next Steps

1. Update frontend application to use JWT tokens
2. Implement token refresh mechanism (optional)
3. Setup password reset functionality (optional)
4. Configure email verification (optional)
5. Setup monitoring and alerts
