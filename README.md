# 🎬 FilmSense — Movie Recommendation Platform
### University Final Project | Computer Science

> 🌐 **Live Demo:** [https://moviereccc.netlify.app](https://moviereccc.netlify.app)

A full-stack web application for personalized movie recommendations. FilmSense provides intelligent suggestions based on user preferences, moods, surveys, and integrates an AI movie expert for tailored advice. Users can explore detailed movie information, watch trailers, and participate in polls for upcoming screenings.

---

## 🚀 Features

- 🔍 **Personalized Recommendations** — custom algorithms that adapt to user preferences and exclude already watched movies
- 🤖 **AI Movie Expert** — integrated assistant powered by **Groq (Llama 3.3)** that guides users with smart insights and suggestions
- 🗳️ **Polls & Surveys** — allows users to vote for upcoming screenings and fine-tune recommendations based on moods, occasions, genres, and more
- 🧑‍💼 **Role-Based Access** — supports Admin, Normal User, Cinema/Streaming Provider, and Guest roles
- 🎥 **Rich Movie Data** — integrates with **TMDb** and **YouTube APIs** to display details, trailers, genres, and cast photos
- 🔐 **Secure Authentication** — JWT-based auth, protected routes, and **Google OAuth** sign-in
- 🔎 **Advanced Search** — filter movies by genre, rating, year, runtime, and actor/director
- 📺 **TV Series** — explore trending and top-rated TV shows alongside movies
- 🌐 **Guest Access** — browse movies, use mood survey, and explore polls without an account

---

## 🛠 Tech Stack

### Frontend
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

### Backend
![.NET](https://img.shields.io/badge/.NET_8-512BD4?style=flat&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?style=flat&logo=c-sharp&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)

### Hosting
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=black)
![Neon](https://img.shields.io/badge/Neon-00E5FF?style=flat&logo=neon&logoColor=black)

---

## 🔗 External Integrations

| Integration | Purpose | Free Tier |
|-------------|---------|-----------|
| 🎬 **TMDb API** | Movie & TV show data, posters, cast, genres | ✅ Free |
| 📺 **YouTube Data API** | Official movie trailers | ✅ Free |
| 🤖 **Groq API (Llama 3.3)** | AI Movie Expert chatbot | ✅ Free |
| 🔐 **Google OAuth** | Sign in with Google | ✅ Free |
| 🗄️ **Neon.tech** | Serverless PostgreSQL database | ✅ Free |
| ⚙️ **Render** | Backend hosting (.NET) | ✅ Free tier |
| 🌐 **Netlify** | Frontend hosting (React) | ✅ Free |

---

## 📸 Screenshots

| | |
|---|---|
| **Homepage** [![Homepage](https://i.postimg.cc/JtVF3Ftm/2.png)](https://postimg.cc/T50QfCrH) | **Movie Detail Page** [![Movie Detail](https://i.postimg.cc/Hs1H9ZqV/11.png)](https://postimg.cc/F1p29Zs4) |
| **Personalized Recommendations** [![Recommendations](https://i.postimg.cc/GpN4D9q1/Untitlesd.png)](https://postimg.cc/d72QPsbW) | **Polls & Surveys** [![Polls](https://i.postimg.cc/c4cqMs7b/4.png)](https://postimg.cc/D8mY73Mr) |
| **Movies Page** [![Movies](https://i.postimg.cc/RCsK3tys/3png.png)](https://postimg.cc/ThbpFKRg) | **Responsive Design** [![Responsive](https://i.postimg.cc/MGNgKXxv/1.png)](https://postimg.cc/Z9PwwbWS) |
| **My Profile** [![Profile](https://i.postimg.cc/DzzCZpYM/Untisdasdtled.png)](https://postimg.cc/yDwhpjKm) | **Top Rated Movies** [![Top Rated](https://i.postimg.cc/SQGzTQKc/Untisdasdtled.png)](https://postimg.cc/Yjh9jHYS) |
| **Create Movie Poll** [![Poll](https://i.postimg.cc/ZqkRYXRT/Untisdasdtled.png)](https://postimg.cc/DSgFBjLD) | **AI Assistant** [![AI](https://i.postimg.cc/02F5Zh7p/Untisdasdtled.png)](https://postimg.cc/bs0jwCCJ) |
| **Admin Dashboard** [![Admin](https://i.postimg.cc/FRHQhxjr/Untisdasdtled.png)](https://postimg.cc/p94SZzG4) | |

---

## ⚙️ Local Setup

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)

### Clone the repository
```bash
git clone https://github.com/subzero0008/movieRec.git
cd movieRec
```

### Backend setup
```bash
cd movierec
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend setup
```bash
cd FrontEnd/movie-rec-frontend
npm install
npm run dev
```

### Environment Variables

**Backend** (`appsettings.json`):
```json
{
  "ConnectionStrings": { "DefaultConnection": "YOUR_DB_URL" },
  "JwtSettings": { "JwtKey": "...", "JwtIssuer": "...", "JwtAudience": "..." },
  "TMDb": { "ApiKey": "...", "AccessToken": "..." },
  "Groq": { "ApiKey": "..." }
}
```

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🔮 Future Improvements

- 🤝 Collaborative filtering for smarter recommendations
- 🔔 Real-time notifications for new polls and screenings
- 👥 Social features — follow friends and share watchlists
- 📱 Mobile app version
- 🌍 Multi-language support

---

## 👨‍💻 Developer

**Yulian Yuriev**
📧 [zerosub07@gmail.com](mailto:zerosub07@gmail.com)

---

*Built with ❤️ as a Computer Science university final project*
