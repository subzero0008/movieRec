# 🎬 Movie Recommendation Platform University Final Project. Computer Science major 

A full-stack web application for personalized movie recommendations. The platform provides intelligent suggestions based on user preferences, moods, surveys, and integrates an AI movie expert for tailored advice. Users can explore detailed movie information, watch trailers, and participate in polls for upcoming screenings.

---

## 🚀 Features

- 🔍 **Personalized Recommendations** — custom algorithms that adapt to user preferences and exclude already watched movies.
- 🤖 **AI Movie Expert** — integrated assistant that guides users with smart insights and suggestions.
- 🗳️ **Polls & Surveys** — allows users to vote for upcoming screenings and fine-tune recommendations based on moods, occasions, genres, and more.
- 🧑‍💼 **Role-Based Access** — supports Admin, Normal User, Cinema/Streaming Provider, and Guest roles.
- 🎥 **Rich Movie Data** — integrates with TMDb and YouTube APIs to display details, trailers, genres, and cast photos.
- 🔐 **Secure Authentication** — with JWT-based auth and protected routes.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, React Router, Axios
- **Backend:** .NET 8 (ASP.NET), C#
- **Database:** PostgreSQL
- **APIs:** TMDb API, YouTube API
- **Other:** Vite, IMemoryCache for caching, SweetAlert2 for UX

---

## 📸 Screenshots

> 

- Homepage [![2.png](https://i.postimg.cc/JtVF3Ftm/2.png)](https://postimg.cc/T50QfCrH)
- Movie Detail Page [![11.png](https://i.postimg.cc/Hs1H9ZqV/11.png)](https://postimg.cc/F1p29Zs4)
- Polls / Surveys [![4.png](https://i.postimg.cc/c4cqMs7b/4.png)](https://postimg.cc/D8mY73Mr)
- Responsive Design [![1.png](https://i.postimg.cc/MGNgKXxv/1.png)](https://postimg.cc/Z9PwwbWS) 
- Movies Page [![3png.png](https://i.postimg.cc/RCsK3tys/3png.png)](https://postimg.cc/ThbpFKRg)
---

## ⚙️ Installation

### 🔧 Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (with npm or yarn)
- [PostgreSQL](https://www.postgresql.org/)

### 📦 Clone the repository

git clone https://github.com/yourusername/movie-recommendation-platform.git
cd movie-recommendation-platform
Setup Backend
cd backend
dotnet restore
dotnet ef database update
dotnet run
🚀 Setup Frontend cd frontend
npm install
npm run dev
API Integrations
TMDb API — for fetching movie details, posters, cast, genres.

YouTube API — for official trailers.

Make sure to set your API keys in the .env files for both frontend and backend.
🙌 Acknowledgements
TMDb for movie data.

YouTube Data API for trailers.
Future Improvements
Collaborative filtering to improve recommendations.

More advanced AI chat support for movie suggestions.

Real-time notifications for new polls or screening events.
Deveolped by Yulian Yuriev :) 


