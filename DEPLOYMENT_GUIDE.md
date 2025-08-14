# OFEM Platform - Production Deployment Guide

## 🎯 Overview

The OnlyFans Enhancement Management (OFEM) platform is a comprehensive, AI-powered system consisting of 6 microservices and a master orchestrator. This guide will help you deploy the complete production-ready platform.

## 📋 Prerequisites

### System Requirements
- **Node.js** v18+ 
- **Python** 3.8+
- **SQLite** (included with Node.js)
- **Git**

### API Keys Required
- **OpenAI API Key** (GPT-4 and DALL-E 3 access)
- **OnlyFans API Credentials** (optional, for direct posting)

### Hardware Recommendations
- **Minimum:** 4GB RAM, 2 CPU cores, 20GB storage
- **Recommended:** 8GB RAM, 4 CPU cores, 50GB storage
- **Production:** 16GB RAM, 8 CPU cores, 100GB storage

## 🚀 Quick Start Deployment

### 1. Environment Setup

```bash
# Clone the repository
git clone <your-ofem-repo>
cd OF-Management-Ai

# Install dependencies for all services
npm install

# Install Python dependencies
pip install pandas sqlite3 numpy python-dotenv

# Create environment file
cp common/env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Service Ports (default values)
MASTER_PORT=3000
SCHEDULER_PORT=3001
CRM_PORT=3002
ANALYTICS_PORT=3003
CONTENT_PORT=3004
REVENUE_PORT=3005

# Database
DATABASE_PATH=./crm.db

# OnlyFans API (optional)
ONLYFANS_API_KEY=your_onlyfans_api_key
ONLYFANS_API_SECRET=your_onlyfans_api_secret

# Additional Configuration
NODE_ENV=production
LOG_LEVEL=info
```

### 3. Database Initialization

The database will be automatically created when services start. To manually initialize:

```bash
# The SQLite database will be created at ./crm.db
# All necessary tables are created automatically by each service
```

### 4. Start All Services

#### Option A: Individual Service Startup (Recommended for Development)

```bash
# Terminal 1 - Scheduler Service
cd 03_scheduling_automation
node api_server.js

# Terminal 2 - CRM Service  
cd 05_crm_subscriber_management
node crm_api.js

# Terminal 3 - Analytics Service
cd 07_analytics_reporting
node analytics_dashboard.js

# Terminal 4 - Content Generation Service
cd 04_content_generation  
node content_api.js

# Terminal 5 - Revenue Optimization Service
cd 06_revenue_optimization
node revenue_api.js

# Terminal 6 - Master Orchestrator
node ofem_master_orchestrator.js
```

#### Option B: Production Startup Script

Create `start_all_services.sh`:

```bash
#!/bin/bash

echo "🚀 Starting OFEM Platform Services..."

# Start all services in background
cd 03_scheduling_automation && node api_server.js &
cd 05_crm_subscriber_management && node crm_api.js &
cd 07_analytics_reporting && node analytics_dashboard.js &
cd 04_content_generation && node content_api.js &
cd 06_revenue_optimization && node revenue_api.js &

# Wait for services to start
sleep 10

# Start master orchestrator
node ofem_master_orchestrator.js

echo "✅ All services started successfully!"
```

```bash
chmod +x start_all_services.sh
./start_all_services.sh
```

## 🔧 Service Configuration

### Port Assignments
- **Master Orchestrator:** http://localhost:3000
- **Scheduler API:** http://localhost:3001  
- **CRM API:** http://localhost:3002
- **Analytics API:** http://localhost:3003
- **Content Generation API:** http://localhost:3004
- **Revenue Optimization API:** http://localhost:3005

### Health Check URLs
Each service provides a health check endpoint:
- `GET /health` - Service health status
- `GET /api/system/health` - Master orchestrator system status

## 📊 Verification & Testing

### 1. Health Checks

```bash
# Check all services
curl http://localhost:3000/api/system/health

# Individual service checks
curl http://localhost:3001/health  # Scheduler
curl http://localhost:3002/health  # CRM
curl http://localhost:3003/health  # Analytics
curl http://localhost:3004/health  # Content
curl http://localhost:3005/health  # Revenue
```

### 2. Master Dashboard

Visit: http://localhost:3000/api/dashboard

Expected response structure:
```json
{
  "system_status": {
    "scheduler": { "status": "healthy" },
    "crm": { "status": "healthy" },
    "analytics": { "status": "healthy" },
    "content": { "status": "healthy" },
    "revenue": { "status": "healthy" }
  },
  "content_scheduling": {...},
  "subscriber_management": {...},
  "analytics_overview": {...},
  "revenue_metrics": {...}
}
```

### 3. Test Key Workflows

#### Create Content Package
```bash
curl -X POST http://localhost:3004/api/generate/package \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "photo",
    "style": "professional", 
    "mood": "confident",
    "include_image": true,
    "include_caption": true
  }'
```

#### Schedule a Post
```bash
curl -X POST http://localhost:3001/api/posts/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post content",
    "caption": "Test caption",
    "publishTime": "2025-01-23T19:00:00.000Z"
  }'
```

#### Create Upsell Campaign
```bash
curl -X POST http://localhost:3005/api/automation/quick-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "target_segment": "bronze_tier",
    "auto_execute": false
  }'
```

## 🤖 Automated Workflows

The platform includes several automated workflows that run on schedules:

### Daily Workflows (9:00 AM)
- **Content Generation:** Creates and schedules new content based on analytics
- **Access:** `POST http://localhost:3000/api/workflows/daily-content`

### Weekly Workflows (Monday 10:00 AM)  
- **Revenue Optimization:** Executes upsell campaigns and A/B tests
- **Access:** `POST http://localhost:3000/api/workflows/revenue-optimization`

### Hourly Workflows
- **CRM Maintenance:** Onboarding, retention, churn prevention
- **Health Monitoring:** Service status checks

### Manual Trigger
```bash
# Trigger daily content workflow
curl -X POST http://localhost:3000/api/workflows/daily-content

# Trigger revenue optimization
curl -X POST http://localhost:3000/api/workflows/revenue-optimization

# Create full content campaign
curl -X POST http://localhost:3000/api/workflows/content-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "content_count": 5,
    "target_segment": "all",
    "include_upsell": true,
    "schedule_days_ahead": 7
  }'
```

## 📈 Production Optimization

### Performance Tuning
1. **Database Optimization**
   - Enable SQLite WAL mode for better concurrency
   - Regular VACUUM operations for maintenance
   - Index optimization for large datasets

2. **Memory Management**
   - Increase Node.js heap size: `--max-old-space-size=4096`
   - Monitor memory usage with built-in health checks

3. **API Rate Limiting**
   - Implement rate limiting for external API calls
   - Use request queuing for OpenAI API calls

### Monitoring & Logging
1. **Service Health**
   - All services report health status every 30 seconds
   - Automatic failover detection
   - Error logging and alerting

2. **Performance Metrics**
   - Response time monitoring
   - Database query performance
   - API call success rates

### Scaling Considerations
1. **Horizontal Scaling**
   - Each microservice can be scaled independently
   - Load balancing for high-traffic scenarios
   - Database replication for read-heavy workloads

2. **Resource Allocation**
   - Content Generation: CPU intensive (image generation)
   - Analytics: Memory intensive (data processing)
   - CRM: Network intensive (message sending)

## 🔒 Security & Maintenance

### Security Best Practices
1. **API Key Management**
   - Store API keys in environment variables
   - Rotate keys regularly
   - Use least-privilege access

2. **Network Security**
   - Firewall configuration for production
   - HTTPS termination at load balancer
   - Internal service communication encryption

### Backup & Recovery
1. **Database Backup**
   ```bash
   # Create backup
   cp crm.db crm_backup_$(date +%Y%m%d_%H%M%S).db
   
   # Automated backup script
   0 2 * * * cp /path/to/crm.db /backups/crm_$(date +\%Y\%m\%d).db
   ```

2. **Configuration Backup**
   - Version control all configuration files
   - Document environment variable requirements
   - Maintain deployment runbooks

### Updates & Maintenance
1. **Service Updates**
   - Rolling updates to maintain availability
   - Health check validation after updates
   - Rollback procedures for failed deployments

2. **Database Maintenance**
   - Regular optimization (ANALYZE, VACUUM)
   - Archive old data periodically
   - Monitor database growth and performance

## 🆘 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check port availability
netstat -tulpn | grep :3000

# Check logs
tail -f logs/service.log

# Verify dependencies
npm list --depth=0
```

#### Database Connection Issues
```bash
# Check database file permissions
ls -la crm.db

# Test database connectivity
sqlite3 crm.db "SELECT COUNT(*) FROM sqlite_master;"
```

#### OpenAI API Issues
```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Service Restart Commands
```bash
# Graceful restart
pkill -f "node.*api_server.js"
pkill -f "node.*crm_api.js"
pkill -f "node.*analytics_dashboard.js"
pkill -f "node.*content_api.js"
pkill -f "node.*revenue_api.js"
pkill -f "node.*ofem_master_orchestrator.js"

# Restart all services
./start_all_services.sh
```

## 📞 Support & Documentation

### API Documentation
- **Master Orchestrator:** http://localhost:3000/api/dashboard
- **Individual Services:** Each service provides OpenAPI documentation
- **Health Status:** http://localhost:3000/api/system/health

### Logs & Debugging
- Service logs are written to console by default
- Enable debug logging: `LOG_LEVEL=debug`
- Database query logging available in development mode

### Community & Updates
- Check `progress.md` for latest feature updates
- Review `DEPLOYMENT_GUIDE.md` for deployment best practices
- Monitor service health dashboards for system status

---

## 🎉 Congratulations!

You now have a fully operational OFEM platform with:
- ✅ **6 Microservices** running independently
- ✅ **Master Orchestration** coordinating all operations  
- ✅ **AI Content Generation** with DALL-E 3 and GPT-4
- ✅ **Revenue Optimization** with A/B testing
- ✅ **Automated Workflows** for content and CRM
- ✅ **Real-time Analytics** and monitoring

The platform is ready for production use and can scale with your business needs!

---

*OFEM v1.0 - Production Deployment Guide*