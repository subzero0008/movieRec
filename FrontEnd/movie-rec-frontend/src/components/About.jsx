import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-900 px-6 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
              About FilmSense
            </h1>
          </div>
          <div className="inline-block bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-semibold px-4 py-1.5 rounded-full">
            🚧 Demo Version — More Updates Coming Soon
          </div>
        </div>

        {/* What is FilmSense */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-6 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎬 What is FilmSense?</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            FilmSense is an intelligent movie recommendation platform designed to help you discover films and TV shows tailored to your personal taste. Whether you are looking for the latest blockbuster, a hidden gem, or a mood-based suggestion — FilmSense has you covered.
          </p>
          <p className="text-gray-300 leading-relaxed">
            The platform combines data from TMDb (The Movie Database) with a smart recommendation engine that learns from your ratings, watched history, and preferences to deliver personalized suggestions just for you.
          </p>
        </div>

        {/* Features */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-6 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">✨ Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🤖', title: 'AI Movie Expert', desc: 'Chat with an AI assistant powered by Llama 3.3 for personalized movie advice' },
              { icon: '⭐', title: 'Smart Recommendations', desc: 'Personalized top 10 picks based on your ratings and watched history' },
              { icon: '📋', title: 'Mood Survey', desc: 'Answer a few questions about your mood and get tailored suggestions' },
              { icon: '🗳️', title: 'Cinema Polls', desc: 'Vote for upcoming screenings and see what the community wants to watch' },
              { icon: '🔍', title: 'Advanced Search', desc: 'Filter movies by genre, rating, year, runtime and cast' },
              { icon: '📺', title: 'TV Series', desc: 'Explore trending and popular TV shows alongside movies' },
              { icon: '🎭', title: 'Role-Based Access', desc: 'Different features for Users, Cinema Providers, and Admins' },
              { icon: '📊', title: 'Community Ratings', desc: 'See how other users rate films on our platform' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-700/50 rounded-xl p-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="text-white font-semibold">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-6 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🛠️ Tech Stack</h2>
          <div className="flex flex-wrap gap-3">
            {['React 19', 'TypeScript', 'Tailwind CSS', 'ASP.NET Core 8', 'C#', 'PostgreSQL', 'Entity Framework', 'JWT Auth', 'TMDb API', 'Groq AI', 'Netlify', 'Render', 'Neon.tech'].map((tech, i) => (
              <span key={i} className="bg-gray-700 text-yellow-300 text-sm px-3 py-1.5 rounded-full border border-gray-600">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-gradient-to-r from-blue-900/40 to-yellow-900/40 border border-yellow-500/30 rounded-2xl p-8 mb-6 shadow-xl">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🚀 This is a Demo Version</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            FilmSense is currently in its demo phase, built as a university final project. The platform is fully functional but more exciting features and improvements are on the way, including:
          </p>
          <ul className="text-gray-300 space-y-2 mb-4">
            <li className="flex items-center gap-2"><span className="text-yellow-400">→</span> Collaborative filtering for smarter recommendations</li>
            <li className="flex items-center gap-2"><span className="text-yellow-400">→</span> Real-time notifications for new polls and screenings</li>
            <li className="flex items-center gap-2"><span className="text-yellow-400">→</span> Social features — follow friends and share watchlists</li>
            <li className="flex items-center gap-2"><span className="text-yellow-400">→</span> Mobile app version</li>
            <li className="flex items-center gap-2"><span className="text-yellow-400">→</span> More advanced AI chat support</li>
          </ul>
          <p className="text-gray-400 text-sm">Stay tuned for updates!</p>
        </div>

        {/* Contact */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">📬 Get in Touch</h2>
          <p className="text-gray-300 mb-6">
            Interested in FilmSense or want to share feedback? Feel free to reach out to the creator!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 bg-gray-700 rounded-xl px-6 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <div className="text-left">
                <p className="text-gray-400 text-xs">Creator</p>
                <p className="text-white font-semibold">Yulian Yuriev</p>
              </div>
            </div>
            
              href="mailto:zerosub07@gmail.com"
              className="flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl px-6 py-4 transition duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              zerosub07@gmail.com
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-yellow-400 hover:text-yellow-300 transition">
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default About;
