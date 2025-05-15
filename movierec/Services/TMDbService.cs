    using Microsoft.Extensions.Caching.Memory;
    using movierec.Models;
using Newtonsoft.Json;
using YourNamespace.Models;
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
    public async Task<MovieSearchResult> DiscoverMoviesAdvancedAsync(DiscoverParams parameters)
    {
        try
        {
            var baseUrl = "discover/movie";
            var queryParams = parameters.ToApiQueryParams();

            // Добавяне на жанрове според повода
            if (!string.IsNullOrEmpty(parameters.Occasion))
            {
                queryParams["with_genres"] = parameters.Occasion switch
                {
                    "Family Time" => AddGenreToParams(queryParams, "10751"), // Family
                    "Date Night" => AddGenreToParams(queryParams, "10749"), // Romance
                    _ => queryParams.ContainsKey("with_genres")
                        ? queryParams["with_genres"]
                        : null
                };
            }

            // Добавяне на теми (ключови думи)
            if (parameters.Themes?.Count > 0)
            {
                var themeKeywords = await GetKeywordIdsByThemes(parameters.Themes);
                if (!string.IsNullOrEmpty(themeKeywords))
                {
                    queryParams["with_keywords"] = themeKeywords;
                }
            }

            // Добавяне на филтър за рейтинг
            if (parameters.IsRatingImportant)
            {
                queryParams["vote_average.gte"] = "7.0";
            }

            // Добавяне на филтър за години (ако не е Classic Cinema)
            if (!string.IsNullOrEmpty(parameters.AgePreference) &&
                parameters.AgePreference != "Doesn't matter" &&
                !(parameters.Themes?.Contains("Classic Cinema") == true))
            {
                queryParams["primary_release_date.gte"] = GetStartDate(parameters.AgePreference);
            }

            // Построяване на URL
            var url = $"{baseUrl}?api_key={_apiKey}";
            foreach (var param in queryParams)
            {
                if (!string.IsNullOrEmpty(param.Value))
                    url += $"&{param.Key}={param.Value}";
            }

            _logger.LogInformation($"TMDb API Request: {url}");

            // Изпращане на заявката
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<MovieSearchResult>(content)
                   ?? new MovieSearchResult { Results = new List<Movie>() };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover movies");
            return new MovieSearchResult { Results = new List<Movie>() };
        }
    }

    private string AddGenreToParams(Dictionary<string, string> queryParams, string genreId)
    {
        if (queryParams.ContainsKey("with_genres"))
        {
            var currentGenres = queryParams["with_genres"];
            return currentGenres.Split(',').Contains(genreId)
                ? currentGenres
                : $"{currentGenres},{genreId}";
        }
        return genreId;
    }

    private string GetStartDate(string agePreference)
    {
        return agePreference switch
        {
            "Last 5 years" => DateTime.Now.AddYears(-5).ToString("yyyy-MM-dd"),
            "Last 10 years" => DateTime.Now.AddYears(-10).ToString("yyyy-MM-dd"),
            "Last 25 years" => DateTime.Now.AddYears(-25).ToString("yyyy-MM-dd"),
            _ => null
        };
    }

    public async Task<string> GetKeywordIdsByThemes(List<string> themes)
    {
        var themeToKeywordId = new Dictionary<string, string>
        {
            ["Based on Book"] = "818",
            ["Oscar Winners"] = "1928",
            ["Classic Cinema"] = "2796",
            ["Spy Movies"] = "9800",
            ["Superhero Movies"] = "1803",
            ["Time Travel"] = "2224",
            ["Zombie Apocalypse"] = "12249"
        };

        var validKeywords = themes
            .Where(themeToKeywordId.ContainsKey)
            .Select(t => themeToKeywordId[t]);

        return string.Join(",", validKeywords);
    }

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

    public async Task<List<int>> GetGenreIds(List<string> genreNames)
    {
        var allGenres = await GetMovieGenresAsync();
        return allGenres
            .Where(g => genreNames.Contains(g.Name, StringComparer.OrdinalIgnoreCase))
            .Select(g => g.Id)
            .ToList();
    }
    public async Task<MovieDetails> GetMovieDetailsAsync(int movieId)
    {
        try
        {
            // 1. Добавете API ключа към основната заявка
            var response = await _httpClient.GetAsync($"movie/{movieId}?api_key={_apiKey}&language=en-US");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var movieDetails = JsonConvert.DeserializeObject<MovieDetails>(content);

            // 2. Добавете API ключа и към заявката за credits
            var creditsResponse = await _httpClient.GetAsync($"movie/{movieId}/credits?api_key={_apiKey}");
            if (creditsResponse.IsSuccessStatusCode)
            {
                var creditsContent = await creditsResponse.Content.ReadAsStringAsync();
                movieDetails.Credits = JsonConvert.DeserializeObject<Credits>(creditsContent);
            }

            return movieDetails;
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning($"Movie with ID {movieId} not found in TMDB");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching movie details for ID {movieId}");
            return null;
        }
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
        string? withKeywords = null,
        int? primaryReleaseYear = null,
        string? sortBy = "popularity.desc",
        int? page = 1,
        int? pageSize = null,
        int? actorId = null,
        int? directorId = null,
        string language = "en-US",
        double? minVoteAverage = null,
        int? minVoteCount = null)
    {
        var cacheKey = $"discover-movies-{genres}-{withKeywords}-{primaryReleaseYear}-{sortBy}-{page}-{pageSize}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"discover/movie?api_key={_apiKey}&language={language}";

                // Add pagination parameters
                if (page.HasValue) url += $"&page={page.Value}";
                if (pageSize.HasValue) url += $"&page_size={pageSize.Value}";

                // Add sorting
                if (!string.IsNullOrEmpty(sortBy))
                    url += $"&sort_by={sortBy}";

                // Add filters
                if (!string.IsNullOrEmpty(genres))
                    url += $"&with_genres={genres}";

                if (!string.IsNullOrEmpty(withKeywords))
                    url += $"&with_keywords={withKeywords}";

                if (primaryReleaseYear.HasValue)
                    url += $"&primary_release_year={primaryReleaseYear.Value}";

                if (actorId.HasValue)
                    url += $"&with_cast={actorId.Value}";

                if (directorId.HasValue)
                    url += $"&with_crew={directorId.Value}";

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MovieSearchResult>(content);

                ProcessMovieResults(result?.Results);
                return result ?? new MovieSearchResult { Results = new List<Movie>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DiscoverMoviesAsync");
                return new MovieSearchResult { Results = new List<Movie>() };
            }
        });
    }

    // Helper method to process movie results



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

    public async Task<TrendingTVShowsResponse> GetTrendingTVShowsAsync(string language = "en-US")
    {
        var cacheKey = $"trending-tv-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);

            try
            {
                var url = $"trending/tv/day?api_key={_apiKey}&language={language}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<TrendingTVShowsResponse>(content);

                ProcessTVShowResults(result?.Results);
                return result ?? new TrendingTVShowsResponse { Results = new List<TVShow>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending TV shows");
                return new TrendingTVShowsResponse { Results = new List<TVShow>() };
            }
        });
    }

    public async Task<TVShowDetails> GetTVShowDetailsAsync(int id, string language = "en-US")
    {
        var cacheKey = $"tvshow-details-{id}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"tv/{id}?api_key={_apiKey}&language={language}&append_to_response=credits,keywords";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return CreateDefaultTVShowDetails(id);
                }

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<TVShowDetails>(content);

                return NormalizeTVShowDetails(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting TV show details for ID {id}");
                return CreateDefaultTVShowDetails(id);
            }
        });
    }

    public async Task<TVShowSearchResult> SearchTVShowsAsync(string query, string language = "en-US")
    {
        var cacheKey = $"tvshow-search-{query}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2);

            try
            {
                var url = $"search/tv?api_key={_apiKey}&language={language}&query={Uri.EscapeDataString(query)}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<TVShowSearchResult>(content);

                ProcessTVShowResults(result?.Results);
                return result ?? new TVShowSearchResult { Results = new List<TVShow>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching TV shows for query: {query}");
                return new TVShowSearchResult { Results = new List<TVShow>() };
            }
        });
    }

    public async Task<SimilarTVShowsResult> GetSimilarTVShowsAsync(int tvShowId, string language = "en-US")
    {
        var cacheKey = $"similar-tvshows-{tvShowId}-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12);

            try
            {
                var url = $"tv/{tvShowId}/similar?api_key={_apiKey}&language={language}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<SimilarTVShowsResult>(content);

                ProcessTVShowResults(result?.Results);
                return result ?? new SimilarTVShowsResult { Results = new List<TVShow>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting similar TV shows for ID {tvShowId}");
                return new SimilarTVShowsResult { Results = new List<TVShow>() };
            }
        });
    }


    private void ProcessTVShowResults(List<TVShow> tvShows)
    {
        if (tvShows == null) return;

        foreach (var tvShow in tvShows)
        {
            if (tvShow is TVShowDetails details)
            {
                NormalizeTVShowDetails(details);
            }
            else
            {
                tvShow.Name ??= "Unknown TV Show";
                tvShow.Overview ??= "No overview available";
                tvShow.PosterPath ??= string.Empty;
            }
        }
    }

    private TVShowDetails NormalizeTVShowDetails(TVShowDetails tvShow)
    {
        if (tvShow == null) return CreateDefaultTVShowDetails(0);

        tvShow.Genres ??= new List<Genre> { new Genre { Name = "Drama" } };

        if (tvShow.Credits == null)
        {
            tvShow.Credits = new Credits
            {
                Cast = { new CastMember { Name = "Unknown Actor" } },
                Crew = { new CrewMember { Name = "Unknown Director", Job = "Director" } }
            };
        }

        return tvShow;
    }

    private TVShowDetails CreateDefaultTVShowDetails(int id)
    {
        return new TVShowDetails
        {
            Id = id,
            Name = "Unknown TV Show",
            Overview = "No overview available",
            PosterPath = string.Empty,
            FirstAirDate = "1900-01-01",
            VoteAverage = 0,
            OriginalName = "Unknown TV Show",
            OriginalLanguage = "en",
            Popularity = 0,
            VoteCount = 0,
            Genres = new List<Genre>(),
            Credits = new Credits
            {
                Cast = new List<CastMember>(),
                Crew = new List<CrewMember>()
            }
        };
    }

    // ========== RESPONSE CLASSES FOR TV SHOWS ==========

    public class TrendingTVShowsResponse
    {
        [JsonProperty("results")]
        public List<TVShow> Results { get; set; } = new List<TVShow>();
    }

    public class TVShowSearchResult
    {
        [JsonProperty("results")]
        public List<TVShow> Results { get; set; } = new List<TVShow>();
    }

    public class SimilarTVShowsResult
    {
        [JsonProperty("results")]
        public List<TVShow> Results { get; set; } = new List<TVShow>();
    }

    public class TVShow
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("overview")]
        public string Overview { get; set; }

        [JsonProperty("poster_path")]
        public string PosterPath { get; set; }

        [JsonProperty("vote_average")]
        public double VoteAverage { get; set; }

        [JsonProperty("first_air_date")]
        public string FirstAirDate { get; set; }

        [JsonProperty("original_name")]
        public string OriginalName { get; set; }

        [JsonProperty("original_language")]
        public string OriginalLanguage { get; set; }

        [JsonProperty("popularity")]
        public double Popularity { get; set; }

        [JsonProperty("vote_count")]
        public int VoteCount { get; set; }

        [JsonProperty("genre_ids")]
        public List<int> GenreIds { get; set; } = new List<int>();
    }

    public class TVShowDetails : TVShow
    {
        [JsonProperty("genres")]
        public List<Genre> Genres { get; set; } = new List<Genre>();

        [JsonProperty("credits")]
        public Credits Credits { get; set; } = new Credits();

        [JsonProperty("seasons")]
        public List<Season> Seasons { get; set; } = new List<Season>();
    }

    public class Season
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("overview")]
        public string Overview { get; set; }

        [JsonProperty("poster_path")]
        public string PosterPath { get; set; }

        [JsonProperty("season_number")]
        public int SeasonNumber { get; set; }

        [JsonProperty("air_date")]
        public string AirDate { get; set; }

        [JsonProperty("episode_count")]
        public int EpisodeCount { get; set; }
    }

    public async Task<List<Genre>> GetTVShowGenresAsync(string language = "en-US")
    {
        var cacheKey = $"tvshow-genres-{language}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);

            try
            {
                var url = $"genre/tv/list?api_key={_apiKey}&language={language}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<GenreListResponse>(content);

                return result?.Genres ?? new List<Genre>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting TV show genres for language: {language}");
                return new List<Genre>();
            }
        });
    }
    public async Task<PaginatedResponse<Movie>> GetMoviesByGenreAsync(int genreId, string language = "en-US", int page = 1)
    {
        var cacheKey = $"movies-by-genre-{genreId}-{language}-{page}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"discover/movie?api_key={_apiKey}&with_genres={genreId}&language={language}&page={page}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<PaginatedResponse<Movie>>(content);

                ProcessMovieResults(result?.Results);
                return result ?? new PaginatedResponse<Movie> { Results = new List<Movie>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting movies for genre ID {genreId}");
                return new PaginatedResponse<Movie> { Results = new List<Movie>() };
            }
        });
    }
    public async Task<PaginatedResponse<TVShow>> GetTVShowsByGenreAsync(int genreId, string language = "en-US", int page = 1)
    {
        var cacheKey = $"tvshows-by-genre-{genreId}-{language}-{page}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);

            try
            {
                var url = $"discover/tv?api_key={_apiKey}&with_genres={genreId}&language={language}&page={page}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<PaginatedResponse<TVShow>>(content);

                // Проверка за нулев резултат
                if (result == null)
                {
                    return new PaginatedResponse<TVShow>
                    {
                        Page = page,
                        Results = new List<TVShow>(),
                        TotalPages = 0,
                        TotalResults = 0
                    };
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting TV shows for genre ID {genreId}");
                return new PaginatedResponse<TVShow>
                {
                    Page = page,
                    Results = new List<TVShow>(),
                    TotalPages = 0,
                    TotalResults = 0
                };
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

    internal async Task<List<Movie>?> DiscoverMoviesAsync(DiscoverParams discoverParams)
    {
        throw new NotImplementedException();
    }

    internal async Task<List<Movie>?> DiscoverMoviesAsync(string genres, string withKeywords, string sortBy, double? voteAverageGte, string? primaryReleaseDateGte, string language, int page)
    {
        throw new NotImplementedException();
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
