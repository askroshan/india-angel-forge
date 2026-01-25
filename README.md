# India Angel Forum

India's largest angel investor network connecting accredited investors with exceptional founders.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI)
- **State**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest, Testing Library, MSW
- **Database**: PostgreSQL

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── api/           # API client and repositories
├── components/    # React components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── lib/           # Utility functions
├── pages/         # Page components
├── test/          # Test utilities
└── types/         # TypeScript types
```

## Testing

This project follows strict TDD (Test-Driven Development) with Red-Green-Refactor cycle:

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to pass the test
3. **REFACTOR**: Improve code while keeping tests green

```bash
# Watch mode
npm test

# Single run
npm run test:run

# Coverage report
npm run test:coverage
```
