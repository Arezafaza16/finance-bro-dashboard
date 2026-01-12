# Finance-Bro Dashboard 💰

Aplikasi dashboard keuangan untuk UMKM Indonesia. Kelola produk, bahan baku, pengeluaran, pemasukan, dan lihat laporan keuangan dalam satu tempat.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-6-green?logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)

## ✨ Fitur

### 📊 Dashboard
- Ringkasan pemasukan, pengeluaran, dan profit
- Grafik tren keuangan 6 bulan terakhir
- Top products dan transaksi terbaru
- Persentase perubahan dari bulan lalu

### 📦 Manajemen Produk
- CRUD produk dengan harga jual dan HPP
- Link bahan baku ke produk
- Kalkulasi otomatis Harga Pokok Produksi

### 🧪 Manajemen Bahan Baku
- CRUD bahan baku dengan satuan dan harga
- Auto-create expense saat menambah stok
- Deduct stok saat produk terjual

### 💸 Pengeluaran
- Catat pengeluaran dengan kategori (Bahan Baku, Produksi, Operasional)
- Filter dan search
- Format mata uang Indonesia

### 💵 Pemasukan
- Catat penjualan produk
- Otomatis isi harga dari data produk
- Link ke customer (opsional)

### 📈 Laporan
- Laporan bulanan (6 bulan terakhir)
- Profit per produk
- Cash flow analysis
- Export CSV untuk semua data

### 🔐 Autentikasi & Keamanan
- Login/Register dengan email & password
- Lupa password dengan OTP via email
- Halaman pengaturan akun
- Ganti password (wajib input password lama)
- Notifikasi email saat password diubah

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local atau Atlas)
- SMTP server (opsional, untuk email)

### Installation

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/finance-bro-dashboard.git
cd finance-bro-dashboard

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local dengan konfigurasi Anda

# Run development server
npm run dev
```

### Environment Variables

Buat file `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/finance-bro
# atau MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finance-bro

# NextAuth
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# SMTP (Opsional - untuk email OTP)
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
│   │   ├── expenses/     # Pengeluaran CRUD
│   │   ├── income/       # Pemasukan CRUD
│   │   ├── materials/    # Bahan Baku CRUD
│   │   └── products/     # Produk CRUD
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

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Date | date-fns |
| Validation | Zod |
| Email | Nodemailer |

## 📱 Screenshots

### Dashboard
![Dashboard](/screenshots/dashboard.png)

### Products Management
![Products](/screenshots/products.png)

### Reports
![Reports](/screenshots/reports.png)

## 🔒 Security Features

- Password hashing dengan bcrypt (12 rounds)
- OTP untuk reset password (6 digit, expires 10 menit)
- Session-based authentication
- Protected API routes
- Email notification on password change

## 📄 License

MIT License - gunakan untuk keperluan pribadi atau komersial.

## 🤝 Contributing

Pull requests welcome! Untuk perubahan besar, silakan buka issue terlebih dahulu.

---

Made with ❤️ for Indonesian SMEs
