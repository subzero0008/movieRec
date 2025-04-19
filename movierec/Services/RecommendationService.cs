using movierec.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;

namespace MovieRecAPI.Services
{
    public class RecommendationService
    {
        private readonly TMDbService _tmdbService;
        private readonly UserMovieService _userMovieService;
        private readonly ILogger<RecommendationService> _logger;
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromSeconds(30);

        public RecommendationService(
            TMDbService tmdbService,
            UserMovieService userMovieService,
            ILogger<RecommendationService> logger,
            IMemoryCache memoryCache)
        {
            _tmdbService = tmdbService;
            _userMovieService = userMovieService;
            _logger = logger;
            _cache = memoryCache;
        }

        public async Task<List<MovieRecommendation>> GetPersonalizedRecommendations(string userId, int count = 10)
        {
            try
            {
                // 1. Fetch user ratings
                var userRatings = await _userMovieService.GetUserRatings(userId);
                if (!userRatings.Any())
                {
                    _logger.LogWarning($"No ratings found for user {userId}");
                    return await GetFallbackRecommendations();
                }

                // 2. Filter highly rated (4-5 stars)
                var highRatedMovies = userRatings
                    .Where(r => r.Rating >= 4.0)
                    .OrderByDescending(r => r.Rating)
                    .ToList();

                if (!highRatedMovies.Any())
                {
                    _logger.LogWarning($"No high rated movies found for user {userId}");
                    return await GetFallbackRecommendations();
                }

                // 3. Analyze user preferences (with caching)
                var cacheKey = $"preferences_{userId}";
                if (!_cache.TryGetValue(cacheKey, out UserPreferences preferences))
                {
                    preferences = await AnalyzeUserPreferences(highRatedMovies);
                    _cache.Set(cacheKey, preferences, _cacheExpiration);
                }

                // 4. Generate movie candidates
                var candidateMovies = await GenerateCandidateMovies(preferences);

                // 5. Filter and sort recommendations
                var recommendations = candidateMovies
                    .Where(m => !userRatings.Any(r => r.MovieId == m.Id))
                    .OrderByDescending(m => m.RelevanceScore)
                    .Take(count)
                    .ToList();

                if (!recommendations.Any())
                {
                    _logger.LogWarning($"No recommendations generated for user {userId}, using fallback");
                    return await GetFallbackRecommendations();
                }

                return recommendations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating recommendations for user {userId}");
                return await GetFallbackRecommendations();
            }
        }

        private async Task<UserPreferences> AnalyzeUserPreferences(List<(int MovieId, double Rating)> highRatedMovies)
        {
            var preferences = new UserPreferences();

            foreach (var (movieId, rating) in highRatedMovies)
            {
                var movie = await _tmdbService.GetMovieDetailsWithCreditsAsync(movieId);
                if (movie == null) continue;

                var weight = rating == 5 ? 2 : 1; // Higher weight for 5-star ratings

                // 1. Process genres
                foreach (var genre in movie.GenreInfo ?? Enumerable.Empty<GenreInfo>())
                {
                    preferences.AddGenre(genre.Name, weight);
                }

                // 2. Process actors
                var topActors = movie.MainCast?
                    .OrderByDescending(a => a.Name) // Using name as we don't have popularity in CastInfo
                    .Take(5);

                foreach (var actor in topActors ?? Enumerable.Empty<CastInfo>())
                {
                    preferences.AddActor(actor.Name, weight);
                }

                // 3. Process directors
                var directors = movie.MainCrew?
                    .Where(c => c.Job.Equals("Director", StringComparison.OrdinalIgnoreCase));

                foreach (var director in directors ?? Enumerable.Empty<CrewInfo>())
                {
                    preferences.AddDirector(director.Name, weight);
                }

                preferences.AddMovieId(movieId);
            }

            preferences.NormalizeWeights();

            _logger.LogInformation($"Generated preferences for user with {highRatedMovies.Count} high rated movies");
            return preferences;
        }

        private async Task<List<MovieRecommendation>> GenerateCandidateMovies(UserPreferences preferences)
        {
            var candidates = new Dictionary<int, MovieRecommendation>();

            // 1. Similar movies from top 3 favorite movies
            foreach (var movieId in preferences.TopRatedMovieIds.Take(3))
            {
                var similar = await _tmdbService.GetSimilarMoviesAsync(movieId);
                foreach (var movie in similar?.Results?.Take(20) ?? Enumerable.Empty<Movie>())
                {
                    if (!candidates.ContainsKey(movie.Id))
                    {
                        var details = await _tmdbService.GetMovieDetailsWithCreditsAsync(movie.Id);
                        if (details != null)
                        {
                            var relevance = CalculateRelevance(details, preferences);
                            candidates[movie.Id] = new MovieRecommendation(details, relevance);
                        }
                    }
                }
            }

            // 2. Search by top genres
            if (preferences.TopGenres.Any())
            {
                var allGenres = await _tmdbService.GetMovieGenresAsync();
                var genreIds = new List<int>();

                foreach (var genreName in preferences.TopGenres)
                {
                    var genre = allGenres.FirstOrDefault(g =>
                        g.Name.Equals(genreName, StringComparison.OrdinalIgnoreCase));
                    if (genre != null)
                    {
                        genreIds.Add(genre.Id);
                    }
                }

                if (genreIds.Any())
                {
                    var byGenres = await _tmdbService.DiscoverMoviesAsync(genres: string.Join(",", genreIds.Take(3)));
                    foreach (var movie in byGenres?.Results?.Take(30) ?? Enumerable.Empty<Movie>())
                    {
                        if (!candidates.ContainsKey(movie.Id))
                        {
                            var details = await _tmdbService.GetMovieDetailsWithCreditsAsync(movie.Id);
                            if (details != null)
                            {
                                var relevance = CalculateRelevance(details, preferences) * 0.8;
                                candidates[movie.Id] = new MovieRecommendation(details, relevance);
                            }
                        }
                    }
                }
            }

            // 3. Search by top actors
            foreach (var actorName in preferences.TopActors.Take(1))
            {
                var actorSearch = await _tmdbService.SearchPersonAsync(actorName);
                var actor = actorSearch?.Results?.FirstOrDefault();

                if (actor != null)
                {
                    var byActor = await _tmdbService.DiscoverMoviesAsync(actorId: actor.Id);
                    foreach (var movie in byActor?.Results?.Take(15) ?? Enumerable.Empty<Movie>())
                    {
                        if (!candidates.ContainsKey(movie.Id))
                        {
                            var details = await _tmdbService.GetMovieDetailsWithCreditsAsync(movie.Id);
                            if (details != null)
                            {
                                var relevance = CalculateRelevance(details, preferences) * 0.9;
                                candidates[movie.Id] = new MovieRecommendation(details, relevance);
                            }
                        }
                    }
                }
            }

            // 4. Search by top directors
            foreach (var directorName in preferences.TopDirectors.Take(1))
            {
                var directorSearch = await _tmdbService.SearchPersonAsync(directorName);
                var director = directorSearch?.Results?.FirstOrDefault();

                if (director != null)
                {
                    var byDirector = await _tmdbService.DiscoverMoviesAsync(directorId: director.Id);
                    foreach (var movie in byDirector?.Results?.Take(15) ?? Enumerable.Empty<Movie>())
                    {
                        if (!candidates.ContainsKey(movie.Id))
                        {
                            var details = await _tmdbService.GetMovieDetailsWithCreditsAsync(movie.Id);
                            if (details != null)
                            {
                                var relevance = CalculateRelevance(details, preferences) * 0.85;
                                candidates[movie.Id] = new MovieRecommendation(details, relevance);
                            }
                        }
                    }
                }
            }

            return candidates.Values.OrderByDescending(m => m.RelevanceScore).ToList();
        }

        private double CalculateRelevance(Movie movie, UserPreferences preferences)
        {
            double score = 0;
            double maxScore = 0;

            // 1. Genres (40%)
            var genreScore = movie.GenreInfo?
                .Sum(g => preferences.GenreWeights.GetValueOrDefault(g.Name, 0)) ?? 0;
            score += genreScore * 0.4;
            maxScore += (preferences.GenreWeights.Any() ? preferences.GenreWeights.Values.Max() : 0) * 0.4;

            // 2. Actors (25%)
            var actorScore = movie.MainCast?
                .Take(5)
                .Sum(a => preferences.ActorWeights.GetValueOrDefault(a.Name, 0)) ?? 0;
            score += actorScore * 0.25;
            maxScore += (preferences.ActorWeights.Any() ? preferences.ActorWeights.Values.Max() : 0) * 0.25;

            // 3. Directors (20%)
            var directorScore = movie.MainCrew?
                .Where(c => c.Job.Equals("Director", StringComparison.OrdinalIgnoreCase))
                .Sum(d => preferences.DirectorWeights.GetValueOrDefault(d.Name, 0)) ?? 0;
            score += directorScore * 0.2;
            maxScore += (preferences.DirectorWeights.Any() ? preferences.DirectorWeights.Values.Max() : 0) * 0.2;

            // 4. Rating (10%)
            var ratingScore = (movie.VoteAverage / 10) * 0.1;
            score += ratingScore;
            maxScore += 0.1;

            // Normalize the score
            return maxScore > 0 ? score / maxScore : 0;
        }

        private async Task<List<MovieRecommendation>> GetFallbackRecommendations()
        {
            try
            {
                var popular = await _tmdbService.GetPopularMoviesAsync();
                var recommendations = new List<MovieRecommendation>();

                if (popular?.Results != null)
                {
                    foreach (var movie in popular.Results.Take(10))
                    {
                        var fullDetails = await _tmdbService.GetMovieDetailsWithCreditsAsync(movie.Id);
                        if (fullDetails != null)
                        {
                            recommendations.Add(new MovieRecommendation(fullDetails, 0.5));
                        }
                    }
                }

                if (!recommendations.Any())
                {
                    recommendations.AddRange(GetHardcodedFallback());
                }

                return recommendations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get fallback recommendations");
                return GetHardcodedFallback();
            }
        }

        private List<MovieRecommendation> GetHardcodedFallback()
        {
            // Return a small set of well-known movies as a last resort
            return new List<MovieRecommendation>
            {
                new MovieRecommendation(new MovieDetails { Id = 278, Title = "The Shawshank Redemption", VoteAverage = 8.7 }, 0.5),
                new MovieRecommendation(new MovieDetails { Id = 238, Title = "The Godfather", VoteAverage = 8.7 }, 0.5),
                new MovieRecommendation(new MovieDetails { Id = 157336, Title = "Interstellar", VoteAverage = 8.4 }, 0.5)
            };
        }
    }
}
