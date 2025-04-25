using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MovieRec.Models.DTOs.Survey;
using movierec.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using movierec.Services;

namespace MovieRec.Services
{
    public class SurveyService
    {
        private readonly TMDbService _tmdbService;
        private readonly IMemoryCache _cache;
        private readonly ILogger<SurveyService> _logger;
        private static readonly Dictionary<string, int> _themeKeywordIds = new()
        {
            ["Based on Book"] = 818,
            ["Oscar Winners"] = 1928,
            ["Classic Cinema"] = 2796,
            ["Spy Movies"] = 9800,
            ["Superhero Movies"] = 1803,
            ["Time Travel"] = 2224,
            ["Zombie Apocalypse"] = 12249
        };

        private static readonly Dictionary<int, string> _genreMappings = new()
        {
            [28] = "Action",
            [12] = "Adventure",
            [16] = "Animation",
            [35] = "Comedy",
            [80] = "Crime",
            [18] = "Drama",
            [10751] = "Family",
            [14] = "Fantasy",
            [36] = "History",
            [27] = "Horror",
            [10402] = "Music",
            [9648] = "Mystery",
            [10749] = "Romance",
            [878] = "Science Fiction",
            [53] = "Thriller",
            [10752] = "War",
            [37] = "Western"
        };

        public SurveyService(TMDbService tmdbService,
                           IMemoryCache cache,
                           ILogger<SurveyService> logger)
        {
            _tmdbService = tmdbService;
            _cache = cache;
            _logger = logger;
        }

        public async Task<SurveyResponse> GetRecommendationsAsync(SurveyRequest request)
        {
            var cacheKey = $"survey-rec-{JsonConvert.SerializeObject(request)}";
            return await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);

                try
                {
                    _logger.LogInformation($"Processing survey request: {JsonConvert.SerializeObject(request)}");

                    // Get initial movie list with all filters
                    var movies = await GetFilteredMovies(request);

                    // If no results, try relaxing some filters
                    if (!movies.Any())
                    {
                        movies = await GetMoviesWithRelaxedFilters(request);
                        _logger.LogWarning($"Used relaxed filters. Found {movies.Count} movies.");
                    }

                    // Process movie details to fill missing data including cast and crew
                    await ProcessMovieDetailsAsync(movies);

                    // Generate personalized explanations
                    var explanations = GenerateExplanations(movies, request);

                    return new SurveyResponse
                    {
                        Movies = movies.Take(10).ToList(),
                        Explanations = explanations
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error generating recommendations");
                    return new SurveyResponse
                    {
                        Movies = new List<Movie>(),
                        Explanations = new Dictionary<int, string>()
                    };
                }
            });
        }

        private async Task<List<Movie>> GetFilteredMovies(SurveyRequest request)
        {
            // Get genre IDs including occasion-specific ones
            var genreIds = await GetGenreIdsWithOccasion(request);

            // Build query parameters
            var genresParam = string.Join(",", genreIds);
            var keywordsParam = GetThemeKeywords(request.Themes);
            var sortBy = GetSortByCriteria(request);
            var minVoteAverage = request.IsRatingImportant ? 7.0 : (double?)null;
            var primaryReleaseYear = (request.AgePreference != "Doesn't matter" &&
                                   !(request.Themes?.Contains("Classic Cinema") == true))
                                  ? GetReleaseYear(request.AgePreference)
                                  : (int?)null;

            _logger.LogDebug($"TMDb query params: genres={genresParam}, keywords={keywordsParam}, sort={sortBy}, minVote={minVoteAverage}, releaseYear={primaryReleaseYear}");

            // Get movies from TMDb
            var movieResult = await _tmdbService.DiscoverMoviesAsync(
                genres: genresParam,
                withKeywords: keywordsParam,
                primaryReleaseYear: primaryReleaseYear,
                sortBy: sortBy,
                minVoteAverage: minVoteAverage,
                language: "en-US",
                page: 1
            );

            return movieResult?.Results ?? new List<Movie>();
        }

        private async Task ProcessMovieDetailsAsync(List<Movie> movies)
        {
            if (movies == null) return;

            foreach (var movie in movies)
            {
                // Ensure GenreInfo is populated from GenreIds
                if ((movie.GenreInfo == null || !movie.GenreInfo.Any()) && movie.GenreIds?.Any() == true)
                {
                    movie.GenreInfo = movie.GenreIds
                        .Select(id => new GenreInfo { Id = id, Name = GetGenreName(id) })
                        .ToList();
                }

                try
                {
                    var movieDetails = await _tmdbService.GetMovieDetailsWithCreditsAsync(movie.Id);

                    // Handle null credits
                    if (movieDetails?.Credits == null)
                    {
                        movieDetails ??= new MovieDetails();
                        movieDetails.Credits = new Credits
                        {
                            Cast = new List<CastMember> { new CastMember { Name = "Unknown Actor" } },
                            Crew = new List<CrewMember> { new CrewMember { Name = "Unknown Director", Job = "Director" } }
                        };
                    }

                    // Process Cast - no Order property available, so we'll just take first 5
                    movie.MainCast = movieDetails.Credits.Cast
                        .Take(5) // Just take first 5 cast members since we can't order by importance
                        .Select(c => new CastInfo
                        {
                            Id = c.TmdbId,
                            Name = string.IsNullOrEmpty(c.Name) ? "Unknown Actor" : c.Name,
                            Character = string.IsNullOrEmpty(c.Character) ? "Unknown Role" : c.Character,
                            ProfileUrl = string.IsNullOrEmpty(c.ProfilePath)
                                ? "/images/default-avatar.jpg"
                                : $"https://image.tmdb.org/t/p/w200{c.ProfilePath}"
                        })
                        .ToList();

                    // Process Crew
                    movie.MainCrew = movieDetails.Credits.Crew
                        .Where(c => c.Job == "Director" || c.Job == "Screenplay" || c.Job == "Producer")
                        .OrderByDescending(c => c.Job == "Director") // Directors first
                        .Take(3)
                        .Select(c => new CrewInfo
                        {
                            Id = c.TmdbId,
                            Name = string.IsNullOrEmpty(c.Name) ? "Unknown Crew" : c.Name,
                            Job = string.IsNullOrEmpty(c.Job) ? "Unknown Job" : c.Job,
                            ProfileUrl = string.IsNullOrEmpty(c.ProfilePath)
                                ? "/images/default-avatar.jpg"
                                : $"https://image.tmdb.org/t/p/w200{c.ProfilePath}"
                        })
                        .ToList();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to fetch credits for movie {movie.Id}");
                    movie.MainCast = new List<CastInfo>
            {
                new CastInfo { Name = "Unknown Actor", Character = "Unknown Role" }
            };
                    movie.MainCrew = new List<CrewInfo>
            {
                new CrewInfo { Name = "Unknown Crew", Job = "Unknown Job" }
            };
                }

                // Final fallback
                movie.MainCast ??= new List<CastInfo>();
                movie.MainCrew ??= new List<CrewInfo>();
            }
        }
        private string GetGenreName(int genreId)
        {
            return _genreMappings.TryGetValue(genreId, out var name)
                ? name
                : "Unknown Genre";
        }

        private async Task<List<int>> GetGenreIdsWithOccasion(SurveyRequest request)
        {
            var genreIds = await _tmdbService.GetGenreIds(request.Genres);

            // Add occasion-specific genres
            if (request.Occasion == "Family Time" && !genreIds.Contains(10751))
            {
                genreIds.Add(10751);
            }
            else if (request.Occasion == "Date Night" && !genreIds.Contains(10749))
            {
                genreIds.Add(10749);
            }

            return genreIds;
        }

        private string GetThemeKeywords(List<string> themes)
        {
            if (themes == null || !themes.Any()) return null;

            var validKeywords = themes
                .Where(_themeKeywordIds.ContainsKey)
                .Select(t => _themeKeywordIds[t].ToString());

            return string.Join(",", validKeywords);
        }

        private async Task<List<Movie>> GetMoviesWithRelaxedFilters(SurveyRequest request)
        {
            // Try relaxing rating filter first
            var relaxedRequest = new SurveyRequest
            {
                Mood = request.Mood,
                Occasion = request.Occasion,
                Genres = request.Genres,
                AgePreference = request.AgePreference,
                Themes = request.Themes,
                IsRatingImportant = false
            };

            var movies = await GetFilteredMovies(relaxedRequest);

            // If still no results, try relaxing occasion filter
            if (!movies.Any() && !string.IsNullOrEmpty(request.Occasion))
            {
                relaxedRequest.Occasion = null;
                movies = await GetFilteredMovies(relaxedRequest);
            }

            return movies;
        }

        private List<Movie> ApplyOccasionFilters(List<Movie> movies, SurveyRequest request)
        {
            if (string.IsNullOrEmpty(request.Occasion)) return movies;

            return request.Occasion switch
            {
                "Family Time" => movies
                    .Where(m => m.VoteAverage >= 5.0)
                    .OrderByDescending(m => m.Popularity)
                    .ToList(),
                "Date Night" => movies
                    .Where(m => m.VoteAverage > 6.0)
                    .OrderByDescending(m => GetRomanceScore(m))
                    .ToList(),
                "Solo" => movies
                    .Where(m => m.VoteAverage > 7.0)
                    .OrderByDescending(m => m.VoteAverage)
                    .ToList(),
                "Party" => movies
                    .Where(m => m.VoteAverage > 6.0)
                    .OrderByDescending(m => m.Popularity)
                    .ToList(),
                _ => movies
            };
        }

        private double GetRomanceScore(Movie movie)
        {
            double score = 0;

            if (movie.GenreInfo?.Any(g => g.Name == "Romance") == true ||
                movie.GenreIds?.Contains(10749) == true)
            {
                score += 2;
            }

            if (movie.Overview?.ToLower().Contains("love") == true)
            {
                score += 1;
            }

            return score;
        }

        private string GetSortByCriteria(SurveyRequest request)
        {
            if (request.IsRatingImportant)
                return "vote_average.desc";

            if (request.Occasion == "Party" || request.Occasion == "Watching with Friends")
                return "popularity.desc";

            return "release_date.desc";
        }

        private int? GetReleaseYear(string agePreference)
        {
            return agePreference switch
            {
                "Last 5 years" => DateTime.Now.Year - 5,
                "Last 10 years" => DateTime.Now.Year - 10,
                "Last 25 years" => DateTime.Now.Year - 25,
                _ => null
            };
        }

        private Dictionary<int, string> GenerateExplanations(List<Movie> movies, SurveyRequest request)
        {
            var explanations = new Dictionary<int, string>();

            foreach (var movie in movies)
            {
                if (movie == null) continue;

                var reasons = new List<string>();

                if (!string.IsNullOrEmpty(request.Mood))
                    reasons.Add($"matches your {request.Mood.ToLower()} mood");

                if (!string.IsNullOrEmpty(request.Occasion))
                    reasons.Add($"perfect for {request.Occasion.ToLower()}");

                if (request.Genres?.Any() == true)
                    reasons.Add($"includes your preferred genres: {string.Join(", ", request.Genres)}");

                if (!string.IsNullOrEmpty(request.AgePreference) &&
                    request.AgePreference != "Doesn't matter" &&
                    !(request.Themes?.Contains("Classic Cinema") == true))
                {
                    reasons.Add($"released in {request.AgePreference.ToLower()}");
                }

                if (request.IsRatingImportant)
                    reasons.Add($"high rating ({movie.VoteAverage:0.0}/10)");

                if (request.Themes?.Any() == true)
                    reasons.Add($"matches themes: {string.Join(", ", request.Themes)}");

                explanations[movie.Id] = $"Recommended because {string.Join("; ", reasons)}";
            }

            return explanations;
        }
    }
}