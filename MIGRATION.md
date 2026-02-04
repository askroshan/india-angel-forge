# Supabase to Prisma Migration

## Overview

This project has been migrated from Supabase to a local PostgreSQL setup using Prisma ORM, JWT authentication, and local file storage.

## Architecture Changes

### Before (Supabase):
- **Database**: Supabase hosted PostgreSQL with auto-generated client
- **Authentication**: Supabase Auth (OAuth, magic links, RLS)
- **File Storage**: Supabase Storage buckets
- **Real-time**: Supabase Realtime subscriptions

### After (Prisma + JWT):
- **Database**: Local PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT tokens with bcrypt password hashing
- **File Storage**: Local filesystem with multer
- **Backend API**: Express.js server

## Setup Instructions

### 1. Install PostgreSQL

Make sure you have PostgreSQL running locally on port 5432.

```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Or use Postgres.app (https://postgresapp.com/)
```

### 2. Configure Database

Update the `DATABASE_URL` in `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/indiaangelforum?schema=public"
```

### 3. Run Migrations

```bash
npm run prisma:migrate
```

This will create all tables in your local database.

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Start Development Servers

Run both frontend and backend:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Backend API
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

## Project Structure

```
/prisma
  /schema.prisma          # Database schema definition
  /migrations             # Migration history
/src
  /lib
    /db.ts                # Prisma client singleton
    /auth.ts              # JWT utilities (sign, verify, hash)
    /storage.ts           # File upload/download utilities
  /contexts
    /AuthContext.tsx      # JWT-based auth context
  /components
    /ProtectedRoute.tsx   # Route guard using JWT
/server.ts                # Express API server
```

## Key Files

### Database Client (`src/lib/db.ts`)
Prisma client singleton for database queries.

```typescript
import { prisma } from '@/lib/db';

// Example query
const users = await prisma.user.findMany();
```

### Authentication (`src/lib/auth.ts`)
JWT token generation and password hashing.

```typescript
import { generateToken, verifyPassword, hashPassword } from '@/lib/auth';

// Generate token
const token = generateToken({ userId: user.id, email: user.email });

// Hash password
const hash = await hashPassword(password);

// Verify password
const isValid = await verifyPassword(password, hash);
```

### File Storage (`src/lib/storage.ts`)
Local file upload/download with multer.

```typescript
import { upload, deleteFile, getFilePath } from '@/lib/storage';

// Use in Express route
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  // file.filename, file.path, file.size
});
```

## API Endpoints

### Auth Routes

- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/update-password` - Update password (requires auth)

### Protected Routes

Use the `authenticateToken` middleware:

```typescript
import { authenticateToken } from './server';

app.get('/api/protected', authenticateToken, (req, res) => {
  // req.user contains JWT payload
  res.json({ userId: req.user.userId });
});
```

## Migration Status

### Completed:
- ✅ Prisma schema defined
- ✅ Database migrations created
- ✅ JWT authentication system
- ✅ File storage system
- ✅ Express API server
- ✅ AuthContext updated
- ✅ ProtectedRoute updated

### In Progress:
- 🔄 Migrating all 28 user story components
- 🔄 Updating all test files
- 🔄 Removing Supabase dependencies

### Pending:
- ⏳ Add data access layer for each feature
- ⏳ Update all page components
- ⏳ Update all test mocks
- ⏳ Email service for password resets
- ⏳ File upload components

## Testing

The test suite needs to be updated to mock Prisma instead of Supabase:

```typescript
// Before (Supabase mock)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// After (Prisma mock)
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));
```

## Prisma Commands

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create and apply a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (⚠️ WARNING: deletes all data)
npx prisma migrate reset

# Pull schema from existing database
npx prisma db pull

# Push schema without creating migration
npx prisma db push
```

## Environment Variables

Required environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR="./uploads"
```

## Security Notes

1. **JWT_SECRET**: Change the default secret in production. Generate a secure one:
   ```bash
   openssl rand -base64 32
   ```

2. **Password Hashing**: Uses bcrypt with 10 salt rounds

3. **File Uploads**: Only allows specific MIME types (PDF, images, documents)

4. **CORS**: Configure appropriately for production

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create database manually if needed
createdb indiaangelforum
```

### Prisma Client Not Generated

```bash
npm run prisma:generate
```

### Port Already in Use

Change ports in `.env` or config files if 3001 or 8080 are taken.

## Next Steps

1. Migrate all existing components one by one
2. Update tests for each component
3. Remove Supabase client imports
4. Test all features thoroughly
5. Deploy to production with proper environment variables
