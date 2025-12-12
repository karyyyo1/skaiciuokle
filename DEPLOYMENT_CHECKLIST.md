# Pre-Deployment Checklist ✅

Use this checklist before deploying to production.

## Before Deployment

### Code & Configuration
- [ ] All code changes committed to Git
- [ ] Database migrations created and tested
- [ ] `appsettings.Production.json` configured (DO NOT commit passwords!)
- [ ] Connection strings use environment variables or Azure Key Vault
- [ ] Error handling implemented
- [ ] Logging configured properly
- [ ] API endpoints tested locally
- [ ] CORS configured if needed

### Security
- [ ] Remove any hardcoded passwords or API keys
- [ ] Enable HTTPS only
- [ ] Configure authentication/authorization
- [ ] Update allowed hosts if restricted
- [ ] Review and minimize exposed endpoints
- [ ] Set secure connection strings (use Key Vault)
- [ ] Configure secure cookies

### Database
- [ ] Database server accessible from cloud
- [ ] Firewall rules configured
- [ ] Backup strategy planned
- [ ] Connection string tested
- [ ] Database migrations ready
- [ ] Sample/test data removed from production DB

### Performance
- [ ] Optimize database queries
- [ ] Enable response compression
- [ ] Configure caching if needed
- [ ] Set appropriate timeout values
- [ ] Review and optimize large file uploads

## During Deployment

### Azure Deployment
- [ ] Resource group created
- [ ] App Service Plan created (correct tier)
- [ ] App Service created
- [ ] MySQL database created (or connection configured)
- [ ] Connection string set in Azure Portal
- [ ] Application deployed successfully
- [ ] Environment variables configured

### AWS Deployment
- [ ] EC2 instance launched and configured
- [ ] Security groups configured (ports 80, 443, 3389)
- [ ] RDS MySQL instance created
- [ ] Elastic IP assigned (optional)
- [ ] Application deployed to IIS
- [ ] IIS configured correctly

## After Deployment

### Testing
- [ ] Application loads successfully
- [ ] Database connection works
- [ ] All API endpoints functional
- [ ] Authentication works
- [ ] File uploads work (if applicable)
- [ ] Error pages display correctly
- [ ] HTTPS redirect works
- [ ] Performance acceptable

### Monitoring
- [ ] Application Insights configured (Azure)
- [ ] CloudWatch configured (AWS)
- [ ] Error logging working
- [ ] Health check endpoint created
- [ ] Alerts configured for errors
- [ ] Uptime monitoring setup

### DNS & Domain (Optional)
- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] SSL certificate installed
- [ ] WWW redirect configured

### Documentation
- [ ] Deployment process documented
- [ ] Connection string backup (encrypted)
- [ ] Admin credentials stored securely
- [ ] Team notified of deployment

## Production Best Practices

### Continuous Monitoring
- Monitor application logs daily
- Check performance metrics
- Review error rates
- Monitor database size and performance

### Regular Maintenance
- Apply security updates monthly
- Review and rotate credentials quarterly
- Test backup restoration quarterly
- Review and optimize costs monthly

### Backup Strategy
- Database: Automated daily backups
- Application files: Version control (Git)
- Configuration: Documented and backed up
- Secrets: Stored in Key Vault/Secrets Manager

## Rollback Plan

If deployment fails:

### Azure
```powershell
# Rollback to previous deployment
az webapp deployment slot swap --name skaiciuokle-app --resource-group skaiciuokle-rg --slot staging --target-slot production
```

### AWS/Manual
1. Keep previous version in separate folder
2. Swap IIS site physical path
3. Restart application pool
4. Verify old version works

## Emergency Contacts

- **Azure Support**: Available in Azure Portal
- **AWS Support**: Available in AWS Console
- **Database Admin**: [Add contact]
- **Team Lead**: [Add contact]

## Common Issues & Solutions

### Issue: 502 Bad Gateway
**Solution**: 
- Check application pool is running
- Review application logs
- Verify web.config is correct

### Issue: Database Connection Timeout
**Solution**:
- Check firewall rules
- Verify connection string
- Check database server is running

### Issue: Application Won't Start
**Solution**:
- Check .NET runtime is installed
- Review logs in Azure Portal or Event Viewer
- Verify all dependencies are deployed

---

**Remember**: Always test in a staging environment before deploying to production!

✅ **Deployment Ready**: When all items are checked, you're ready to deploy!
