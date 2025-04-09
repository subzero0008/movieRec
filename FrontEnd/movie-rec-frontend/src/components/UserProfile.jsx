import WatchedMoviesList from './WatchedMoviesList';

function UserProfile() {
  return (
    <div className="user-profile">
      <h1>Моят профил</h1>
      <section>
        <h2>Гледани филми</h2>
        <WatchedMoviesList />
      </section>
    </div>
  );
}