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



