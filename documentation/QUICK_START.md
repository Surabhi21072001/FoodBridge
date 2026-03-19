# FoodBridge Backend - Quick Start

Get the backend running in 5 minutes.

## Prerequisites Check

```bash
node --version    # Need 18+
npm --version     # Need 9+
psql --version    # Need 14+
```

Don't have these? See [INSTALLATION.md](INSTALLATION.md) for setup instructions.

## Installation (3 steps)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DB_PASSWORD` - Your PostgreSQL password
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`

### 3. Setup Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE foodbridge;"

# Apply schema
psql -U postgres -d foodbridge -f ../database/schema.sql

# Load sample data (optional)
psql -U postgres -d foodbridge -f ../database/seeds/sample_data.sql
```

## Run

```bash
npm run dev
```

You should see:
```
🚀 FoodBridge API server running on port 3000
```

## Test

```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"healthy","timestamp":"...","uptime":...}
```

## Try the API

### Register a User

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from the response!

### Get Listings

```bash
curl http://localhost:3000/api/listings
```

## What's Next?

- **Full API Reference:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Detailed Setup:** [INSTALLATION.md](INSTALLATION.md)
- **Architecture Guide:** [README.md](README.md)
- **Import Reference:** [IMPORTS_REFERENCE.md](IMPORTS_REFERENCE.md)

## Common Issues

**"Cannot find module"**
```bash
npm install
```

**"Database connection failed"**
- Check PostgreSQL is running
- Verify `.env` credentials

**"Port already in use"**
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill -9`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database connection
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── repositories/    # Database queries
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, errors
│   ├── validators/      # Zod schemas
│   ├── utils/           # Helpers
│   ├── types/           # TypeScript types
│   └── index.ts         # App entry point
├── package.json
├── tsconfig.json
└── .env
```

## Available Scripts

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Build for production
npm start        # Start production server
npm test         # Run tests
```

## API Endpoints Overview

### Authentication
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login
- `GET /api/users/profile` - Get profile (auth required)

### Food Listings
- `GET /api/listings` - List all listings
- `POST /api/listings` - Create listing (provider)
- `GET /api/listings/:id` - Get listing
- `PUT /api/listings/:id` - Update listing (provider)

### Reservations
- `POST /api/reservations` - Create reservation (student)
- `GET /api/reservations` - Get user reservations
- `DELETE /api/reservations/:id` - Cancel reservation
- `POST /api/reservations/:id/confirm-pickup` - Confirm pickup

### Pantry
- `GET /api/pantry/inventory` - List inventory
- `POST /api/pantry/appointments` - Book appointment (student)
- `GET /api/pantry/orders/cart` - Get cart (student)
- `POST /api/pantry/orders/cart/items` - Add to cart

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.

## Sample Data

If you loaded sample data, you can login with:

**Student:**
- Email: `alice.student@university.edu`
- Password: `password123`

**Provider:**
- Email: `dining.hall@university.edu`
- Password: `password123`

**Admin:**
- Email: `admin@university.edu`
- Password: `password123`

## Development Tips

1. **Hot Reload:** Changes auto-reload with `npm run dev`
2. **Type Safety:** TypeScript catches errors before runtime
3. **Database Queries:** Check console for SQL query logs
4. **Error Messages:** Detailed errors in development mode
5. **API Testing:** Use Postman, Insomnia, or curl

## Need Help?

1. Check error messages in terminal
2. Review [INSTALLATION.md](INSTALLATION.md) troubleshooting section
3. Verify all prerequisites are installed
4. Ensure database is running and accessible

## Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database created and schema applied
- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Can register and login users
- [ ] Can fetch listings

All checked? You're ready to develop! 🚀
