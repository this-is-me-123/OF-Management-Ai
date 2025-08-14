#!/bin/bash

# OFEM Mobile App Deployment Script
# Builds and deploys the mobile-first Progressive Web App

set -e

echo "🚀 Starting OFEM Mobile App Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Display current directory
echo "📁 Current directory: $(pwd)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting (if eslint is configured)
if [ -f ".eslintrc.json" ]; then
    echo "🔍 Running linter..."
    npm run lint || echo "⚠️ Linting warnings detected"
fi

# Build the application
echo "🔨 Building mobile app..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"

# Display build size information
echo "📊 Build size information:"
du -sh dist/

# Create deployment info
cat > dist/deployment-info.json << EOF
{
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "buildType": "mobile-pwa",
  "features": [
    "Progressive Web App",
    "Mobile-First Design", 
    "Offline Support",
    "Push Notifications",
    "Touch Optimized",
    "OFEM API Integration"
  ]
}
EOF

# Display deployment information
echo "📱 OFEM Mobile App Build Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Build directory: ./dist"
echo "🌐 Ready for deployment to web server"
echo "📲 PWA features enabled for mobile installation"
echo "🔧 API proxy configured for backend integration"
echo ""
echo "🎯 Next Steps:"
echo "1. Copy ./dist/* to your web server"
echo "2. Configure reverse proxy for /api/* routes"
echo "3. Set up HTTPS for PWA features"
echo "4. Test installation on mobile devices"
echo ""
echo "📋 Mobile App Features:"
echo "├── 📱 Mobile-responsive design"
echo "├── 🚀 Progressive Web App (PWA)"
echo "├── 📶 Offline support with service worker"
echo "├── 🔔 Push notification ready"
echo "├── 👆 Touch-optimized interface"
echo "├── 🎨 Modern Material Design"
echo "├── 🔐 Secure authentication"
echo "├── 📊 Real-time dashboard"
echo "├── 📅 Content scheduler"
echo "├── 👥 Subscriber management"
echo "├── 📈 Analytics & reporting"
echo "└── ⚙️  Settings & preferences"
echo ""
echo "🔗 Integration Points:"
echo "├── OFEM Integration Controller"
echo "├── Browser Automation Service" 
echo "├── CRM & Subscriber Management"
echo "├── Analytics & Reporting Service"
echo "└── Content Generation Pipeline"
echo ""

# Check for common deployment environments
echo "💻 Deployment Options:"

if command -v nginx &> /dev/null; then
    echo "├── ✅ Nginx detected - ready for static file serving"
else
    echo "├── ⚠️  Nginx not found - consider installing for production"
fi

if command -v docker &> /dev/null; then
    echo "├── ✅ Docker detected - containerization available"
else
    echo "├── ⚠️  Docker not found - consider for easy deployment"
fi

if command -v pm2 &> /dev/null; then
    echo "├── ✅ PM2 detected - process management available"
else
    echo "├── ⚠️  PM2 not found - consider for Node.js process management"
fi

echo "└── 🌍 Static hosting services (Vercel, Netlify, Cloudflare)"
echo ""

# Preview mode option
read -p "🖥️  Start preview server? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Starting preview server..."
    npm run preview
else
    echo "✨ Deployment preparation complete!"
    echo "🚀 Your OFEM mobile app is ready to deploy!"
fi