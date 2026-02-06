<div align="center">

# 📝 Assesly

### Modern Exam Management & Assessment Platform

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=netlify)](https://assesly.netlify.app)
[![Backend](https://img.shields.io/badge/api-online-blue?style=for-the-badge&logo=render)](https://assesly.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](LICENSE)

[Live Demo](https://assesly.netlify.app) • [Report Bug](https://github.com/lemayan/Assesly/issues) • [Request Feature](https://github.com/lemayan/Assesly/issues)

</div>

---

## 🚀 Quick Start

Try the live demo with these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@examina.local | password123 |
| **Student** | student@examina.local | password123 |

> ⚠️ **Note:** Backend may take 30-50 seconds to wake up on first request (free tier limitation).

---

## ✨ Features

### 👨‍💼 Admin Features
- 📊 **Dashboard Analytics** - View exam statistics and performance metrics
- ✏️ **Exam Management** - Create, edit, and delete exams
- ❓ **Question Bank** - Manage questions with multiple choice options
- 📤 **Bulk Import** - Import questions via CSV/Excel
- 👥 **User Management** - Manage students and administrators
- 📈 **Results Overview** - Monitor student performance across all exams

### 👨‍🎓 Student Features
- 📝 **Take Exams** - Clean, distraction-free exam interface
- ⏱️ **Timed Assessments** - Automatic submission on timeout
- 📊 **View Results** - Detailed performance breakdown
- 🎯 **Progress Tracking** - Track scores and improvements
- 📄 **PDF Reports** - Download detailed result reports

### 🎨 UI/UX Features
- 🌓 **Dark/Light Mode** - Toggle between themes
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎭 **Animated Backgrounds** - Beautiful cloud and night sky animations
- 🎉 **Success Animations** - Celebratory confetti on exam completion
- ⚡ **Fast & Modern** - Built with React and Vite for optimal performance

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)

- **Express.js** - Web framework
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Production database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Helmet** - Security middleware

### Deployment
![Netlify](https://img.shields.io/badge/Netlify-Frontend-00C7B7?style=flat&logo=netlify&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=flat&logo=render&logoColor=white)

---

## 📦 Installation

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))

### Clone the Repository
```bash
git clone https://github.com/lemayan/Assesly.git
cd Assesly
```

### Backend Setup

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="your-secret-key-here"
   NODE_ENV="development"
   PORT=4000
   ```

4. **Initialize database**
   ```bash
   npx prisma db push
   npm run seed
   ```

5. **Start the backend**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:4000`

### Frontend Setup

1. **Open a new terminal and navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local` file** (optional for local dev)
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```

4. **Start the frontend**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### 🎉 You're Ready!
Open [http://localhost:5173](http://localhost:5173) and log in with:
- **Admin:** admin@examina.local / password123
- **Student:** student@examina.local / password123

---

## 📁 Project Structure

```
Assesly/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React Context providers
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and HTTP client
│   │   └── styles.css     # Global styles
│   └── package.json
│
├── backend/               # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── index.ts       # App entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── package.json
│
└── README.md
```

---

## 🚀 Deployment

### Deploy to Netlify (Frontend)

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
6. Add environment variable:
   - `VITE_API_URL` = Your backend URL
7. Deploy!

### Deploy to Render (Backend)

1. Go to [Render](https://render.com/)
2. Create a new **PostgreSQL** database
3. Create a new **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install --include=dev && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate resolve --rolled-back 20250829111232_lemayan && npx prisma migrate deploy && npm start`
6. Add environment variables:
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `JWT_SECRET` = Random 32+ character string
   - `NODE_ENV` = `production`
   - `CORS_ORIGINS` = Your Netlify frontend URL
7. Deploy!

For detailed deployment instructions, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) and [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Lemayan**
- GitHub: [@lemayan](https://github.com/lemayan)
- Project Link: [https://github.com/lemayan/Assesly](https://github.com/lemayan/Assesly)

---

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Netlify](https://www.netlify.com/)
- [Render](https://render.com/)

---

<div align="center">

### ⭐ Star this repo if you found it helpful!

Made with ❤️ by Lemayan

</div>
