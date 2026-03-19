# FoodBridge Backend Installation Guide

Complete guide to install and run the FoodBridge backend API.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git** (optional, for cloning)

### Verify Prerequisites

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
psql --version    # Should show 14.x or higher
```

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd backend
./setup.sh
```

This script will:
- Check prerequisites
- Install all dependencies
- Create .env file from template
- Provide database setup instructions

### Option 2: Manual Setup

Follow the steps below for manual installation.

## Step-by-Step Installation

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- express, pg, dotenv, bcrypt, jsonwebtoken, zod, cors, helmet, express-rate-limit
- TypeScript and all type definitions
- Development tools (ts-node-dev, jest)

**Expected output:**
```
added 500+ packages in 30s
```

### 3. Configure Environment Variables

Create `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
nano .env
# or
code .env
```

**Required configuration:**

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodbridge
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

# JWT
JWT_SECRET=your_secure_random_secret_here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** 
- Replace `your_actual_password_here` with your PostgreSQL password
- Generate a secure JWT secret (use `openssl rand -base64 32`)

### 4. Setup Database

#### Create Database

```bash
psql -U postgres -c "CREATE DATABASE foodbridge;"
```

If prompted for password, enter your PostgreSQL password.

#### Run Schema

```bash
psql -U postgres -d foodbridge -f ../database/schema.sql
```

This creates all tables, indexes, and triggers.

#### Load Sample Data (Optional)

```bash
psql -U postgres -d foodbridge -f ../database/seeds/sample_data.sql
```

This adds test users, listings, and other sample data.

### 5. Verify Installation

Check that TypeScript compiles without errors:

```bash
npm run build
```

**Expected output:**
```
Successfully compiled TypeScript
```

### 6. Start Development Server

```bash
npm run dev
```

**Expected output:**
```
🚀 FoodBridge API server running on port 3000
📝 Environment: development
🔗 Health check: http://localhost:3000/health
```

### 7. Test the API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-10T12:00:00.000Z",
  "uptime": 5.123
}
```

## Troubleshooting

### Issue: "Cannot find module 'express'"

**Cause:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Database connection failed"

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify credentials in `.env` match your PostgreSQL setup

3. Test connection manually:
   ```bash
   psql -U postgres -d foodbridge -c "SELECT 1;"
   ```

### Issue: "Port 3000 already in use"

**Cause:** Another process is using port 3000

**Solution:**
1. Change port in `.env`:
   ```env
   PORT=3001
   ```

2. Or kill the process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

### Issue: TypeScript compilation errors

**Cause:** Missing type definitions or configuration issues

**Solution:**
1. Reinstall dev dependencies:
   ```bash
   npm install --save-dev @types/express @types/node @types/pg @types/bcrypt @types/jsonwebtoken @types/cors
   ```

2. Verify `tsconfig.json` exists and is valid

3. Clean build:
   ```bash
   rm -rf dist
   npm run build
   ```

### Issue: "JWT_SECRET is not defined"

**Cause:** Environment variables not loaded

**Solution:**
1. Ensure `.env` file exists in backend directory
2. Verify `.env` contains `JWT_SECRET=...`
3. Restart the server

### Issue: Database schema errors

**Cause:** Schema not applied or outdated

**Solution:**
1. Drop and recreate database:
   ```bash
   psql -U postgres -c "DROP DATABASE IF EXISTS foodbridge;"
   psql -U postgres -c "CREATE DATABASE foodbridge;"
   psql -U postgres -d foodbridge -f ../database/schema.sql
   ```

## Development Workflow

### Running the Server

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- userService.test.ts
```

### Code Quality

```bash
# Type check
npx tsc --noEmit

# Format code (if prettier is configured)
npx prettier --write "src/**/*.ts"
```

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates optimized JavaScript in the `dist/` directory.

### Environment Variables

Set production environment variables:

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_NAME=foodbridge_prod
JWT_SECRET=your-production-secret
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Using Process Manager (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start with PM2:
```bash
pm2 start dist/index.js --name foodbridge-api
pm2 save
pm2 startup
```

## Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
docker build -t foodbridge-backend .
docker run -p 3000:3000 --env-file .env foodbridge-backend
```

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Type check
npx tsc --noEmit

# Database operations
psql -U postgres -d foodbridge

# View logs (if using PM2)
pm2 logs foodbridge-api

# Restart server (if using PM2)
pm2 restart foodbridge-api
```

## Next Steps

After successful installation:

1. **Read the API Documentation:** `API_DOCUMENTATION.md`
2. **Review the README:** `README.md`
3. **Test the endpoints:** Use Postman or curl
4. **Explore the code:** Start with `src/index.ts`

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review error messages carefully
3. Check the logs for detailed error information
4. Verify all prerequisites are installed correctly
5. Ensure database is running and accessible

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
