# KGL Management System

A full-stack inventory and sales management system for Karibu Groceries LTD. It supports procurement, cash sales, credit sales, and real-time stock tracking across two branches. The system replaces manual record-keeping with a centralized, role-based web application.

## Technologies Used

- Node.js, Express.js
- MongoDB, Mongoose
- HTML, CSS, JavaScript
- Pug (Templating Engine)

## Features

- Managers can record produce procurement and set sale prices.
- Sales agents can record cash and credit sales.
- Stock levels are updated automatically after every transaction.
- Prevents sales when stock is unavailable.
- Admin (Mr. Orban) can view total sales across all branches.
- Role-based access: Manager, Sales Agent, and Admin.

## Project Structure

- controllers/ – Business logic and dashboard data handling
- models/ – Mongoose schemas for users, sales, produce, credit
- routes/ – Express route handlers
- views/ – Pug templates for frontend
- public/ – Static assets (CSS, JS, images)
- server.js – Application entry point
- .env – Environment config
- .gitignore, package.json, package-lock.json

## Environment Setup

The application requires the following environment variables to be set:

### Required Environment Variables

```env
# Database Configuration
DATABASE=mongodb+srv://your-mongodb-connection-string

# Session Configuration
SESSION_SECRET=your-session-secret

# Superuser Configuration
SUPERUSER_EMAIL=your-superuser-email
SUPERUSER_PASSWORD=your-superuser-password
SUPERUSER_ID=your-superuser-id
SUPERUSER_FNAME=your-superuser-firstname
SUPERUSER_LNAME=your-superuser-lastname

# Environment
NODE_ENV=production
```

### Setting Up Environment Variables

1. For local development:

   - Create a `.env` file in the root directory
   - Copy the above variables and fill in your values
   - Never commit the `.env` file to version control

2. For production (Render):
   - Go to your Render dashboard
   - Select your service
   - Go to "Environment" tab
   - Add each environment variable with its value
   - Click "Save Changes"
   - Redeploy your application

### Security Notes

- Never commit sensitive credentials to version control
- Use strong, unique passwords for all accounts
- Regularly rotate passwords and secrets
- Keep your environment variables secure
- Use different credentials for development and production

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the development server: `npm start`

## Production Deployment

1. Set up all required environment variables in your hosting platform
2. Deploy the application
3. Verify all environment variables are correctly set
4. Test the application thoroughly
