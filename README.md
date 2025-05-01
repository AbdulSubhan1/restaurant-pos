# Restaurant POS System

A modern restaurant Point of Sale (POS) system built with Next.js and shadcn UI components. This system helps restaurants manage orders, tables, menu items, and staff.

## Tech Stack

- **Frontend/Backend**: Next.js (App Router)
- **UI Components**: shadcn UI with Tailwind CSS
- **Database**: PostgreSQL
- **ORM/Schema Management**: Drizzle ORM
- **Authentication**: Custom JWT-based authentication
- **Real-time Updates**: Socket.io
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **API Structure**: tRPC for type-safe APIs
- **Notifications**: Sonner for in-app notifications

## Features

- Role-based authentication (Admin, Manager, Server, Kitchen Staff)
- Menu management (items, categories)
- Table management with visual layout
- Order creation and management
- Real-time kitchen display system
- Basic reporting and analytics

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string
   - Set a secure `JWT_SECRET`

4. Generate database migrations:

   ```
   npm run migrate:generate
   ```

5. Run migrations:

   ```
   npm run migrate
   ```

6. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/src/app` - Next.js application routes
- `/src/components` - Reusable UI components
- `/src/db` - Database schema and operations
- `/src/features` - Feature-specific components and logic
- `/src/lib` - Utility functions
- `/src/hooks` - Custom React hooks
- `/src/store` - Zustand state management
- `/src/server` - tRPC API definitions

## License

This project is licensed under the MIT License.
