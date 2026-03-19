# Backend Imports Reference

This document lists all the imports used across the backend codebase for reference.

## Core Dependencies

### Express & HTTP
```typescript
import express, { Application, Request, Response, NextFunction, Router } from 'express';
```

### Database (PostgreSQL)
```typescript
import { Pool, PoolClient } from 'pg';
```

### Environment Variables
```typescript
import dotenv from 'dotenv';
```

### Authentication & Security
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
```

### Validation
```typescript
import { z, ZodSchema, ZodError } from 'zod';
```

## Import Patterns by File Type

### Configuration Files
**database.ts**
```typescript
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
```

### Middleware Files
**auth.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
```

**errorHandler.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
```

**validator.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
```

### Repository Files
```typescript
import { query, getClient, transaction } from '../config/database';
import { PoolClient } from 'pg';
import { TypeName } from '../types';
```

### Service Files
```typescript
import { RepositoryName } from '../repositories/repositoryName';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from '../utils/errors';
import { transaction } from '../config/database';
import { TypeName } from '../types';
```

### Controller Files
```typescript
import { Response, NextFunction } from 'express';
import { ServiceName } from '../services/serviceName';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';
```

### Route Files
```typescript
import { Router } from 'express';
import { ControllerName } from '../controllers/controllerName';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { validatorSchemas } from '../validators/validatorName';
```

### Validator Files
```typescript
import { z } from 'zod';
```

## Custom Module Imports

### Utils
```typescript
// Error classes
import { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '../utils/errors';

// Response helpers
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
```

### Middleware
```typescript
// Authentication
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

// Validation
import { validate } from '../middleware/validator';

// Error handling
import { errorHandler } from '../middleware/errorHandler';
```

### Database
```typescript
// Query functions
import { query, getClient, transaction } from '../config/database';

// Default pool
import pool from '../config/database';
```

## Complete Dependency List

All dependencies are defined in `package.json`:

### Production Dependencies
- `express` - Web framework
- `pg` - PostgreSQL client
- `dotenv` - Environment variables
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `zod` - Schema validation
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

### Development Dependencies
- `@types/express` - Express TypeScript types
- `@types/node` - Node.js TypeScript types
- `@types/pg` - PostgreSQL TypeScript types
- `@types/bcrypt` - Bcrypt TypeScript types
- `@types/jsonwebtoken` - JWT TypeScript types
- `@types/cors` - CORS TypeScript types
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server with hot reload
- `jest` - Testing framework
- `@types/jest` - Jest TypeScript types

## Installation

To install all dependencies:

```bash
cd backend
npm install
```

## Troubleshooting

### Module not found errors

If you see "Cannot find module" errors:

1. **Ensure dependencies are installed:**
   ```bash
   npm install
   ```

2. **Check TypeScript configuration:**
   - Verify `tsconfig.json` exists
   - Ensure `moduleResolution` is set to "node"

3. **Rebuild node_modules:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check import paths:**
   - Use relative paths for local modules: `'../config/database'`
   - Use package names for node_modules: `'express'`

### Type declaration errors

If you see type declaration errors:

1. **Install type definitions:**
   ```bash
   npm install --save-dev @types/express @types/node @types/pg
   ```

2. **Check tsconfig.json:**
   - Ensure `"skipLibCheck": true` is set
   - Verify `"esModuleInterop": true` is set

### Path resolution issues

If imports can't be resolved:

1. **Check file extensions:**
   - Don't include `.ts` in import paths
   - Use `'./file'` not `'./file.ts'`

2. **Verify directory structure:**
   - All source files should be in `src/`
   - Follow the documented structure

## Quick Reference

### Most Common Imports

**Controller:**
```typescript
import { Response, NextFunction } from 'express';
import { ServiceName } from '../services/serviceName';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';
```

**Service:**
```typescript
import { RepositoryName } from '../repositories/repositoryName';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { TypeName } from '../types';
```

**Repository:**
```typescript
import { query } from '../config/database';
import { TypeName } from '../types';
```

**Route:**
```typescript
import { Router } from 'express';
import { ControllerName } from '../controllers/controllerName';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
```
