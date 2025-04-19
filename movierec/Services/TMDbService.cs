    using Microsoft.Extensions.Caching.Memory;
    using movierec.Models;
    using Newtonsoft.Json;

public class TMDbService
{

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<TMDbService> _logger;
    private readonly string _apiKey;

    public TMDbService(HttpClient httpClient, IConfiguration configuration, IMemoryCache cache, ILogger<TMDbService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
        _apiKey = _configuration["TMDb:ApiKey"];

        _httpClient.BaseAddress = new Uri("https://api.themoviedb.org/3/");
        _httpClient.DefaultRequestHeaders.Accept.Add(
            new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<MovieDetails> GetMovieDetailsWithCreditsAsync(int id, string language = "en-US")
    {
        var cacheKey = $"movie-details-{id}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"movie/{id}?api_key={_apiKey}&language={language}&append_to_response=credits,keywords";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return CreateDefaultMovieDetails(id); // Използване на новия метод
                }

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieDetails>(content);

                return NormalizeMovieDetails(result); // Нормализация на резултата
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting movie details for ID {id}");
                return CreateDefaultMovieDetails(id); // Fallback
            }
        });
    }
    public async Task<SimilarMoviesResult> GetSimilarMoviesAsync(int movieId, string language = "en-US")
    {
        var cacheKey = $"similar-movies-{movieId}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12);

            try
            {
                var url = $"movie/{movieId}/similar?api_key={_apiKey}&language={language}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<SimilarMoviesResult>(content);

                ProcessMovieResults(result?.Results);
                return result ?? new SimilarMoviesResult { Results = new List<Movie>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting similar movies for movie ID {movieId}");
                return new SimilarMoviesResult { Results = new List<Movie>() };
            }
        });

    }
    public async Task<MovieCollection> GetCollectionInfoAsync(int movieId, string language = "en-US")
    {
        var cacheKey = $"movie-collection-{movieId}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);

            try
            {
                // Първо взимаме детайлите на филма за да намерим ID на колекцията
                var movieDetails = await GetMovieDetailsWithCreditsAsync(movieId, language);
                if (movieDetails?.BelongsToCollection == null)
                {
                    return new MovieCollection();
                }

                // След това взимаме самата колекция
                var url = $"collection/{movieDetails.BelongsToCollection.Id}?api_key={_apiKey}&language={language}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<MovieCollection>(content) ?? new MovieCollection();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting collection for movie ID {movieId}");
                return new MovieCollection();
            }
        });
    }

    // Останалите съществуващи методи остават непроменени
   
    public async Task<MovieSearchResult> GetPopularMoviesAsync(string language = "en-US")
    {
        var cacheKey = $"popular-movies-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"movie/popular?api_key={_apiKey}&language={language}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieSearchResult>(content);

                ProcessMovieResults(result?.Results);
                return result ?? new MovieSearchResult { Results = new List<Movie>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popular movies");
                return new MovieSearchResult { Results = new List<Movie>() };
            }
        });
    }

    public async Task<List<Movie>> GetMoviesByGenresAsync(List<string> genres, string language = "en-US")
    {
        var cacheKey = $"movies-by-genres-{string.Join("-", genres)}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var genreIds = await GetGenreIds(genres);
                var genreQuery = string.Join(",", genreIds);

                var url = $"discover/movie?api_key={_apiKey}&language={language}" +
                         $"&with_genres={genreQuery}&sort_by=popularity.desc";

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieSearchResult>(content);

                ProcessMovieResults(result?.Results);
                return result?.Results
   .GroupBy(m => m.Id)
   .Select(g => g.First())
   .ToList() ?? new List<Movie>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting movies by genres: {string.Join(", ", genres)}");
                return new List<Movie>();
            }
        });
    }

    public async Task<MovieSearchResult> SearchMoviesAsync(string query, string language = "en-US")
    {
        var cacheKey = $"movie-search-{query}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2);

            try
            {
                var url = $"search/movie?api_key={_apiKey}&language={language}&query={Uri.EscapeDataString(query)}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieSearchResult>(content);

                ProcessMovieResults(result?.Results);
                return result ?? new MovieSearchResult { Results = new List<Movie>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching movies for query: {query}");
                return new MovieSearchResult { Results = new List<Movie>() };
            }
        });
    }

    public async Task<MovieSearchResult> GetTrendingMoviesAsync(string language = "en-US")
    {
        var cacheKey = $"trending-movies-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);

            try
            {
                var url = $"trending/movie/day?api_key={_apiKey}&language={language}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieSearchResult>(content);

                ProcessMovieResults(result?.Results);
                return result ?? new MovieSearchResult { Results = new List<Movie>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending movies");
                return new MovieSearchResult { Results = new List<Movie>() };
            }
        });
    }

    private async Task<List<int>> GetGenreIds(List<string> genreNames)
    {
        var allGenres = await GetMovieGenresAsync();
        return allGenres
            .Where(g => genreNames.Contains(g.Name, StringComparer.OrdinalIgnoreCase))
            .Select(g => g.Id)
            .ToList();
    }

    public async Task<List<Genre>> GetMovieGenresAsync()
    {
        var cacheKey = "movie-genres";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);

            try
            {
                var url = $"genre/movie/list?api_key={_apiKey}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<GenreListResponse>(content);

                return result?.Genres ?? new List<Genre>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting movie genres");
                return new List<Genre>();
            }
        });
    }

    private void ProcessMovieResults(List<Movie> movies)
    {
        if (movies == null) return;
        ProcessMovie(movies);
    }

    private void ProcessMovie(IEnumerable<Movie> movies)
    {
        if (movies == null) return;

        foreach (var movie in movies)
        {
            if (movie is MovieDetails details)
            {
                NormalizeMovieDetails(details); // Нормализация за MovieDetails
            }
            else
            {
                // Базова нормализация за обикновени Movie обекти
                movie.Title ??= "Unknown Movie";
                movie.Overview ??= "No overview available";
                movie.PosterPath ??= string.Empty;
            }
        }
    }
    private MovieDetails NormalizeMovieDetails(MovieDetails movie)
    {
        if (movie == null) return CreateDefaultMovieDetails(0);

        // Принудително попълване на основни полета
        movie.Genres ??= new List<Genre> { new Genre { Name = "Drama" } }; // Примерен fallback жанр

        if (movie.Credits == null)
        {
            movie.Credits = new Credits
            {
                Cast = { new CastMember { Name = "Unknown Actor" } }, // Fallback актьор
                Crew = { new CrewMember { Name = "Unknown Director", Job = "Director" } }
            };
        }

        return movie;
    }
    public async Task<MovieSearchResult> DiscoverMoviesAsync(
    string? genres = null,
    int? actorId = null,
    int? directorId = null,
    string language = "en-US",
    int page = 1)
    {
        var cacheKey = $"discover-movies-{genres}-{actorId}-{directorId}-{language}-{page}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"discover/movie?api_key={_apiKey}&language={language}&page={page}&sort_by=popularity.desc";

                // Add optional parameters
                if (!string.IsNullOrEmpty(genres))
                {
                    url += $"&with_genres={genres}";
                }
                if (actorId.HasValue)
                {
                    url += $"&with_cast={actorId.Value}";
                }
                if (directorId.HasValue)
                {
                    url += $"&with_crew={directorId.Value}";
                }

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieSearchResult>(content);

                ProcessMovieResults(result?.Results);
                return result ?? new MovieSearchResult { Results = new List<Movie>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error discovering movies with genres: {genres}, actor: {actorId}, director: {directorId}");
                return new MovieSearchResult { Results = new List<Movie>() };
            }
        });
    }
   

    public async Task<PersonSearchResult> SearchPersonAsync(string name)
    {
        var cacheKey = $"person-search-{name}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"search/person?api_key={_apiKey}&query={Uri.EscapeDataString(name)}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<PersonSearchResult>(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching for person: {name}");
                return new PersonSearchResult { Results = new List<Person>() };
            }
        });
    }

    private MovieDetails CreateDefaultMovieDetails(int id)
    {
        return new MovieDetails
        {
            Id = id,
            Title = "Unknown Movie",
            Overview = "No overview available",
            PosterPath = string.Empty,
            ReleaseDate = "1900-01-01",
            VoteAverage = 0,
            OriginalTitle = "Unknown Movie",
            OriginalLanguage = "en",
            Popularity = 0,
            VoteCount = 0,
            GenreInfo = new List<GenreInfo>(),
            MainCast = new List<CastInfo>(),
            MainCrew = new List<CrewInfo>()
        };
    }
    public class MovieCollection
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("overview")]
        public string Overview { get; set; } = string.Empty;

        [JsonProperty("poster_path")]
        public string PosterPath { get; set; } = string.Empty;

        [JsonProperty("backdrop_path")]
        public string BackdropPath { get; set; } = string.Empty;

        [JsonProperty("parts")]
        public List<CollectionMovie> Parts { get; set; } = new List<CollectionMovie>();
    }

    public class CollectionMovie
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; } = string.Empty;

        [JsonProperty("poster_path")]
        public string PosterPath { get; set; } = string.Empty;

        [JsonProperty("release_date")]
        public string ReleaseDate { get; set; } = string.Empty;
    }
    // Response classes moved inside TMDbService class
    public class GenreListResponse
    {
        [JsonProperty("genres")]
        public List<Genre> Genres { get; set; } = new List<Genre>();
    }

    public class PersonSearchResult
    {
        [JsonProperty("results")]
        public List<Person> Results { get; set; } = new List<Person>();
    }

    public class Person
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("popularity")]
        public double Popularity { get; set; }

        [JsonProperty("profile_path")]
        public string ProfilePath { get; set; } = string.Empty;
    }
}
