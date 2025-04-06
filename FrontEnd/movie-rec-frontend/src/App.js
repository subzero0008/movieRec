import React from 'react';
import './App.css';
import { AuthProvider } from './AuthContext'; // Импортирай AuthProvider
import MovieList from './MovieList'; // Пример за компонент, който ще използва контекста

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <header className="App-header">
          <p>Edit <code>src/App.js</code> and save to reload.</p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
        <MovieList /> {/* Пример за използване на контекста */}
      </div>
    </AuthProvider>
  );
}

export default App;
