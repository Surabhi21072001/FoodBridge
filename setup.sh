#!/bin/bash

# FoodBridge Backend Setup Script

echo "🚀 Setting up FoodBridge Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Check if PostgreSQL is installed
echo ""
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed: $(psql --version)"
    echo ""
    echo "📊 To setup the database, run:"
    echo "   psql -U postgres -c \"CREATE DATABASE foodbridge;\""
    echo "   psql -U postgres -d foodbridge -f ../database/schema.sql"
    echo "   psql -U postgres -d foodbridge -f ../database/seeds/sample_data.sql"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL 14+ and setup the database."
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Setup the database using the commands above"
echo "3. Run 'npm run dev' to start the development server"
echo ""
