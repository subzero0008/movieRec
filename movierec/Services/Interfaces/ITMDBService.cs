using movierec.Models;

public interface ITMDbService
{
    Task<MovieSearchResult> GetTrendingMoviesAsync();
    Task<MovieDetails> GetMovieDetailsWithCreditsAsync(int id);
    Task<MovieSearchResult> SearchMoviesAsync(string query);
    Task<List<Genre>> GetMovieGenresAsync();
    Task<MovieSearchResult> GetMoviesByGenreAsync(int genreId);
}