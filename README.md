# Finance-Bro Dashboard 💰

A financial dashboard application for Indonesian MSMEs. Manage products, raw materials, expenses, income, and view financial reports in one place.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-6-green?logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)

## ✨ Features

### 📊 Dashboard

* Summary of income, expenses, and profit
* Financial trend chart for the last 6 months
* Top products and latest transactions
* Percentage change compared to last month

### 📦 Product Management

* Product CRUD with selling price and COGS
* Link raw materials to products
* Automatic Cost of Goods Manufactured calculation

### 🧪 Raw Material Management

* Raw material CRUD with units and pricing
* Auto-create expense when adding stock
* Deduct stock when products are sold

### 💸 Expenses

* Record expenses by category (Raw Materials, Production, Operational)
* Filter and search
* Indonesian currency formatting

### 💵 Income

* Record product sales
* Automatically fill prices from product data
* Optional customer linking

### 📈 Reports

* Monthly reports (last 6 months)
* Profit per product
* Cash flow analysis
* CSV export for all data

### 🔐 Authentication & Security

* Login/Register with email & password
* Forgot password with OTP via email
* Account settings page
* Change password (requires current password)
* Email notification when password is changed

## 🚀 Quick Start

### Prerequisites

* Node.js 18+
* MongoDB (local or Atlas)
* SMTP server (optional, for email)

### Installation

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/finance-bro-dashboard.git
cd finance-bro-dashboard

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/finance-bro
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finance-bro

# NextAuth
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# SMTP (Optional - for OTP email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API Routes
│   │   ├── account/      # Profile & Change Password
│   │   ├── auth/         # Login, Register, Forgot Password
│   │   ├── dashboard/    # Dashboard data
│   │   ├── expenses/     # Expenses CRUD
│   │   ├── income/       # Income CRUD
│   │   ├── materials/    # Raw Materials CRUD
│   │   └── products/     # Products CRUD
│   ├── dashboard/        # Dashboard pages
│   │   ├── expenses/
│   │   ├── income/
│   │   ├── materials/
│   │   ├── products/
│   │   ├── reports/
│   │   └── settings/
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── components/
│   └── layout/
│       └── Sidebar.tsx
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── email.ts          # Email utility
│   └── mongodb.ts        # MongoDB connection
└── models/               # Mongoose models
    ├── User.ts
    ├── Product.ts
    ├── Material.ts
    ├── Expense.ts
    └── Income.ts
```

## 🛠️ Tech Stack

| Category   | Technology              |
| ---------- | ----------------------- |
| Framework  | Next.js 14 (App Router) |
| Language   | TypeScript              |
| Database   | MongoDB + Mongoose      |
| Auth       | NextAuth.js             |
| Styling    | Tailwind CSS 4          |
| Icons      | Lucide React            |
| Date       | date-fns                |
| Validation | Zod                     |
| Email      | Nodemailer              |

## 📱 Screenshots

### Dashboard

![Dashboard](/screenshots/dashboard.png)

### Products Management

![Products](/screenshots/products.png)

### Reports

![Reports](/screenshots/reports.png)

## 🔒 Security Features

* Password hashing with bcrypt (12 rounds)
* OTP for password reset (6 digits, expires in 10 minutes)
* Session-based authentication
* Protected API routes
* Email notification on password change

## 📄 License

MIT License — free to use for personal or commercial purposes.
