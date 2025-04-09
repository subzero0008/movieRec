using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using TMDb.Models;

public class TMDbService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<TMDbService> _logger;
    private readonly string _apiKey;

    public TMDbService(
        HttpClient httpClient,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<TMDbService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _apiKey = _configuration["TMDb:ApiKey"];
        if (string.IsNullOrEmpty(_apiKey))
        {
            throw new InvalidOperationException("TMDB API key is not configured");
        }

        _httpClient.BaseAddress = new Uri("https://api.themoviedb.org/3/");
        _httpClient.DefaultRequestHeaders.Accept.Add(
            new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<MovieDetails> GetMovieDetailsWithCreditsAsync(int id, string language = "en-US")
    {
        var cacheKey = $"movie-{id}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"movie/{id}?api_key={_apiKey}&language={language}&append_to_response=credits";
                var response = await _httpClient.GetAsync(url);

                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieDetails>(content) ??
                    throw new InvalidOperationException("Failed to deserialize movie details");

                // Process data
                result.PosterUrl = string.IsNullOrEmpty(result.PosterPath)
                    ? "/images/default-poster.jpg"
                    : $"https://image.tmdb.org/t/p/w500{result.PosterPath}";

                // Логване за дебъг
                _logger.LogDebug($"Movie ID: {id}, Original ReleaseDate: {result.ReleaseDate}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting movie details for ID {id}");
                return null;
            }
        });
    }

    public async Task<MovieSearchResult> SearchMoviesAsync(string query, string language = "bg-BG")
    {
        try
        {
            var url = $"search/movie?api_key={_apiKey}&language={language}&query={Uri.EscapeDataString(query)}";
            var response = await _httpClient.GetStringAsync(url);
            var result = JsonConvert.DeserializeObject<MovieSearchResult>(response);

            ProcessMovieResults(result?.Results);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error searching movies for query: {query}");
            return null;
        }
    }

    public async Task<MovieSearchResult> GetTrendingMoviesAsync(string language = "bg-BG")
    {
        try
        {
            var url = $"trending/movie/day?api_key={_apiKey}&language={language}";
            var response = await _httpClient.GetStringAsync(url);
            var result = JsonConvert.DeserializeObject<MovieSearchResult>(response);

            ProcessMovieResults(result?.Results);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending movies");
            return null;
        }
    }

    private void ProcessMovieResults(List<Movie> movies)
    {
        if (movies == null) return;

        foreach (var movie in movies)
        {
            movie.PosterUrl = string.IsNullOrEmpty(movie.PosterPath)
                ? "/images/default-poster.jpg"
                : $"https://image.tmdb.org/t/p/w500{movie.PosterPath}";

            // Не променяме ReleaseDate, оставяме я както е от API
            // Годината ще се изчислява автоматично от ReleaseYear property в модела
        }
    }
}