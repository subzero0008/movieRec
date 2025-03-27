using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Net.Http;
using System.Threading.Tasks;
using TMDb.Models; // Ensure you have this namespace to access models

public class TMDbService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public TMDbService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;

        // Set Authorization header with access token if available
        var accessToken = _configuration["TMDb:AccessToken"];
        if (!string.IsNullOrEmpty(accessToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        }
    }

    // Method for searching movies by title
    public async Task<MovieSearchResult> SearchMoviesAsync(string query)
    {
        // Get API key from configuration
        var apiKey = _configuration["TMDb:ApiKey"];

        // Build the URL for the movie search API
        string url = $"https://api.themoviedb.org/3/search/movie?query={query}&api_key={apiKey}";

        // Send the request and get the response
        var response = await _httpClient.GetStringAsync(url);

        // Deserialize the JSON response into a MovieSearchResult object
        var result = JsonConvert.DeserializeObject<MovieSearchResult>(response);

        // Process the results to handle null values
        if (result?.Results != null)
        {
            foreach (var movie in result.Results)
            {
                // Check and handle empty PosterPath
                if (string.IsNullOrEmpty(movie.PosterPath))
                {
                    movie.PosterUrl = "https://example.com/default-poster.jpg"; // Set a default image
                }
                else
                {
                    movie.PosterUrl = $"https://image.tmdb.org/t/p/w500{movie.PosterPath}";
                }

                // Check and handle empty ReleaseDate
                if (string.IsNullOrEmpty(movie.ReleaseDate))
                {
                    movie.ReleaseDate = "Unknown"; // Set a default value
                }
            }
        }

        return result;
    }

    // Method for getting trending movies
    public async Task<MovieSearchResult> GetTrendingMoviesAsync()
    {
        // Get API key from configuration
        var apiKey = _configuration["TMDb:ApiKey"];

        // Build the URL for the trending movies API
        string url = $"https://api.themoviedb.org/3/trending/movie/day?api_key={apiKey}";

        // Send the request and get the response
        var response = await _httpClient.GetStringAsync(url);

        // Deserialize the JSON response into a MovieSearchResult object
        var result = JsonConvert.DeserializeObject<MovieSearchResult>(response);

        // Process the results to handle null values
        if (result?.Results != null)
        {
            foreach (var movie in result.Results)
            {
                // Check and handle empty PosterPath
                if (string.IsNullOrEmpty(movie.PosterPath))
                {
                    movie.PosterUrl = "https://example.com/default-poster.jpg"; // Set a default image
                }
                else
                {
                    movie.PosterUrl = $"https://image.tmdb.org/t/p/w500{movie.PosterPath}";
                }

                // Check and handle empty ReleaseDate
                if (string.IsNullOrEmpty(movie.ReleaseDate))
                {
                    movie.ReleaseDate = "Unknown"; // Set a default value
                }
            }
        }

        return result;
    }

    // Method for getting movie details by ID
    public async Task<MovieDetails> GetMovieDetailsAsync(int id)
    {
        // Get API key from configuration
        var apiKey = _configuration["TMDb:ApiKey"];

        // Build the URL for the movie details API
        string url = $"https://api.themoviedb.org/3/movie/{id}?api_key={apiKey}";

        // Send the request and get the response
        var response = await _httpClient.GetStringAsync(url);

        // Deserialize the JSON response into a MovieDetails object
        var result = JsonConvert.DeserializeObject<MovieDetails>(response);

        // Check and handle empty PosterPath in details
        if (string.IsNullOrEmpty(result?.PosterPath))
        {
            result.PosterUrl = "https://example.com/default-poster.jpg"; // Set a default image
        }
        else
        {
            result.PosterUrl = $"https://image.tmdb.org/t/p/w500{result.PosterPath}";
        }

        // Check and handle empty ReleaseDate in details
        if (string.IsNullOrEmpty(result?.ReleaseDate))
        {
            result.ReleaseDate = "Unknown"; // Set a default value
        }

        return result;
    }
}
