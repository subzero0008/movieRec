using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieRecAPI.Data;
using movierec.Models;
using movierec.DTOs;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using System.Globalization;

[Route("api/movieratings")]
[ApiController]
[Authorize]
public class MovieRatingsController : ControllerBase
{
    private readonly MovieRecDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly ILogger<MovieRatingsController> _logger;
    private readonly TMDbService _tmdbService;  // Add TMDbService
    private readonly IMemoryCache _cache;

    // Modify constructor to inject TMDbService
    public MovieRatingsController(
     MovieRecDbContext context,
     UserManager<AppUser> userManager,
     ILogger<MovieRatingsController> logger,
     TMDbService tmdbService,  // Inject TMDbService
     IMemoryCache cache)  // Inject IMemoryCache
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
        _tmdbService = tmdbService;  // Store TMDbService
        _cache = cache;  // Store IMemoryCache
    }


    [HttpPost("rate")]
    [Authorize]
    public async Task<IActionResult> RateMovie([FromBody] RateMovieDto model)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Невалидни данни за рейтинг {@Model}", model);
                return BadRequest(new
                {
                    Success = false,
                    Message = "Невалидни данни",
                    Errors = ModelState.Values.SelectMany(v => v.Errors)
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Невалиден потребителски идентификатор");
                return Unauthorized(new { Success = false, Message = "Невалиден потребител" });
            }

            // Опционално: Валидация с TMDB API
            /*
            if (!await _tmdbService.MovieExists(model.MovieId))
            {
                return BadRequest(new { Success = false, Message = "Филмът не е намерен в TMDB" });
            }
            */

            var existingRating = await _context.MovieRatings
                .FirstOrDefaultAsync(r => r.UserId == userId && r.MovieId == model.MovieId);

            if (existingRating != null)
            {
                _logger.LogInformation("Актуализиране на рейтинг за филм {MovieId} от {UserId}",
                    model.MovieId, userId);

                existingRating.Rating = model.Rating;
                existingRating.Review = model.Review;
                existingRating.RatedOn = DateTime.UtcNow;
            }
            else
            {
                _logger.LogInformation("Нов рейтинг за филм {MovieId} от {UserId}",
                    model.MovieId, userId);

                _context.MovieRatings.Add(new MovieRating
                {
                    UserId = userId,
                    MovieId = model.MovieId,
                    Rating = model.Rating,
                    Review = model.Review,
                    RatedOn = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            for (int count = 1; count <= 100; count++)
            {
                _cache.Remove($"recs_{userId}_{count}");
            }

            return Ok(new
            {
                Success = true,
                Message = "Рейтингът е запазен",
                MovieId = model.MovieId,
                Rating = model.Rating
            });
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while saving rating");
            return StatusCode(500, new
            {
                Success = false,
                Message = "Грешка в базата данни",
                Error = dbEx.InnerException?.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Грешка при запазване на рейтинг");
            return StatusCode(500, new
            {
                Success = false,
                Message = "Вътрешна грешка в сървъра",
                Error = ex.Message
            });
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<UserRatingDto>>> GetUserRatings(
    string userId,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] int? minRating = null,
    [FromQuery] DateTime? fromDate = null)
    {
        try
        {
            // Validate userId
            if (!Guid.TryParse(userId, out _))
            {
                _logger.LogWarning("Invalid userId format: {UserId}", userId);
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid user ID format"
                });
            }

            // Check access permissions
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId != userId)
            {
                _logger.LogWarning("Access attempt to another user's ratings: {CurrentUserId} -> {UserId}",
                    currentUserId, userId);
                return Forbid();
            }

            // Base query
            var query = _context.MovieRatings
                .Where(r => r.UserId == userId);

            // Apply filters
            if (minRating.HasValue)
            {
                query = query.Where(r => r.Rating >= minRating.Value);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(r => r.RatedOn >= fromDate.Value);
            }

            // Pagination
            var totalCount = await query.CountAsync();

            // Fetch ratings into memory first (not async)
            var ratingsList = await query
                .OrderByDescending(r => r.RatedOn)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(); // This will fetch ratings synchronously

            // Now use async to fetch movie details for each rating
            var userRatingsDto = new List<UserRatingDto>();

            foreach (var rating in ratingsList)
            {
                var movieTitle = await GetMovieTitle(rating.MovieId); // Get movie title
                var movieGenres = await GetMovieGenres(rating.MovieId); // Get movie genres

                userRatingsDto.Add(new UserRatingDto
                {
                    MovieId = rating.MovieId,
                    Rating = rating.Rating,
                    RatedOn = rating.RatedOn,
                    Review = rating.Review,
                    MovieTitle = movieTitle,
                    MovieGenres = movieGenres
                });
            }

            _logger.LogInformation("Returned {Count} out of {TotalCount} ratings for user {UserId}",
                userRatingsDto.Count, totalCount, userId);

            return Ok(new
            {
                Success = true,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize,
                Ratings = userRatingsDto
            });

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching ratings for user {UserId}", userId);
            return StatusCode(500, new
            {
                Success = false,
                Message = "An error occurred while processing the request",
                Error = ex.Message
            });
        }
    }

    // Fetch movie title by MovieId
    private async Task<string> GetMovieTitle(int movieId)
    {
        var movieDetails = await _tmdbService.GetMovieDetailsWithCreditsAsync(movieId);
        return movieDetails?.Title ?? "Unknown Movie";
    }

    // Fetch movie genres by MovieId
    private async Task<List<string>> GetMovieGenres(int movieId)
    {
        var movieDetails = await _tmdbService.GetMovieDetailsWithCreditsAsync(movieId);

        if (movieDetails != null && movieDetails.Genres != null)
        {
            return movieDetails.Genres.Select(g => g.Name).ToList();
        }

        return new List<string> { "Unknown Genre" };
    }

    [HttpGet("{movieId}")] // Това е новият метод
    public async Task<IActionResult> GetMovieRatings(int movieId)
    {
        try
        {
            var ratings = await _context.MovieRatings
             .Where(r => r.MovieId == movieId)
             .OrderByDescending(r => r.RatedOn)
             .Select(r => new
             {
                 r.UserId,
                 r.Rating,
                 r.Review,
                 r.RatedOn,
                 UserName = r.User.UserName
             })
                .ToListAsync();

            return Ok(new
            {
                Success = true,
                Count = ratings.Count,
                Ratings = ratings
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Грешка при получаване на рейтинги за филм {MovieId}", movieId);
            return StatusCode(500, new
            {
                Success = false,
                Message = "Грешка при зареждане на рейтингите",
                Error = ex.Message
            });
        }
    }
   [HttpGet("top-rated-all")]
[Authorize(Roles = "Cinema")]
public async Task<IActionResult> GetTopRatedMoviesAllTime()
{
    try
    {
        var groupedRatings = await _context.MovieRatings
            .GroupBy(r => r.MovieId)
            .Select(g => new
            {
                MovieId = g.Key,
                AverageRating = g.Average(r => r.Rating),
                RatingCount = g.Count(),
                LastRated = g.Max(r => r.RatedOn)
            })
            .Where(g => g.RatingCount >= 5)
            .OrderByDescending(g => g.AverageRating)
            .ThenByDescending(g => g.RatingCount)
            .Take(10)
            .ToListAsync();

        var movieDetails = new List<MovieRatingDto>();
        foreach (var item in groupedRatings)
        {
            try
            {
                var details = await _tmdbService.GetMovieDetailsWithCreditsAsync(item.MovieId);
                if (details == null) continue;

                DateTime? releaseDate = null;
                int? releaseYear = null;
                if (!string.IsNullOrEmpty(details.ReleaseDate) &&
                    DateTime.TryParse(details.ReleaseDate, out var parsedDate))
                {
                    releaseDate = parsedDate;
                    releaseYear = parsedDate.Year;
                }

                movieDetails.Add(new MovieRatingDto
                {
                    MovieId = item.MovieId,
                    MovieTitle = details.Title ?? "Unknown",
                    PosterPath = details.PosterPath != null
                        ? $"https://image.tmdb.org/t/p/w200{details.PosterPath}"
                        : null,
                    Genres = details.Genres?.Select(g => new GenreDto { Id = g.Id, Name = g.Name }).ToList(),
                    AverageRating = Math.Round(item.AverageRating, 1),
                    TmdbVoteAverage = details.VoteAverage, // Добавено TMDB рейтинг
                    RatingCount = item.RatingCount,
                    LastRated = item.LastRated.ToString("yyyy-MM-dd"),
                    ReleaseDate = releaseDate?.ToString("yyyy-MM-dd"),
                    ReleaseYear = releaseYear
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error processing movie {MovieId}", item.MovieId);
                continue;
            }
        }

        return Ok(new
        {
            Success = true,
            TotalMovies = movieDetails.Count,
            Movies = movieDetails
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching top rated movies (all time)");
        return StatusCode(500, new
        {
            Success = false,
            Message = "An error occurred while processing the request",
            Error = ex.Message
        });
    }
}
    [HttpGet("top-rated")]
    [Authorize(Roles = "Cinema")]
    public async Task<IActionResult> GetTopRatedMovies(
    [FromQuery] int? genreId = null,
    [FromQuery] int? year = null,
    [FromQuery] int? month = null)
    {
        try
        {
            var ratingsQuery = _context.MovieRatings
                .AsQueryable();

            if (year.HasValue && month.HasValue)
            {
                var startDate = new DateTime(year.Value, month.Value, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);
                ratingsQuery = ratingsQuery
                    .Where(r => r.RatedOn >= startDate && r.RatedOn <= endDate);
            }

            var groupedRatings = await ratingsQuery
                .GroupBy(r => r.MovieId)
                .Select(g => new
                {
                    MovieId = g.Key,
                    AverageRating = g.Average(r => r.Rating),
                    RatingCount = g.Count(),
                    LastRated = g.Max(r => r.RatedOn)
                })
                .Where(g => g.RatingCount >= 1)
                .OrderByDescending(g => g.AverageRating)
                .ThenByDescending(g => g.RatingCount)
                .Take(20)
                .ToListAsync();

            var movieDetails = new List<MovieRatingDto>();
            foreach (var item in groupedRatings)
            {
                try
                {
                    var details = await _tmdbService.GetMovieDetailsWithCreditsAsync(item.MovieId);
                    if (details == null) continue;

                    if (genreId.HasValue)
                    {
                        var hasGenre = details.Genres?.Any(g => g.Id == genreId.Value) ?? false;
                        if (!hasGenre) continue;
                    }

                    DateTime? releaseDate = null;
                    int? releaseYear = null;
                    if (!string.IsNullOrEmpty(details.ReleaseDate) &&
                        DateTime.TryParse(details.ReleaseDate, out var parsedDate))
                    {
                        releaseDate = parsedDate;
                        releaseYear = parsedDate.Year;
                    }

                    movieDetails.Add(new MovieRatingDto
                    {
                        MovieId = item.MovieId,
                        MovieTitle = details.Title ?? "Unknown",
                        PosterPath = details.PosterPath != null
                            ? $"https://image.tmdb.org/t/p/w200{details.PosterPath}"
                            : null,
                        Genres = details.Genres?.Select(g => new GenreDto { Id = g.Id, Name = g.Name }).ToList(),
                        AverageRating = Math.Round(item.AverageRating, 1),
                        TmdbVoteAverage = details.VoteAverage, // Добавено TMDB рейтинг
                        RatingCount = item.RatingCount,
                        LastRated = item.LastRated.ToString("yyyy-MM-dd"),
                        ReleaseDate = releaseDate?.ToString("yyyy-MM-dd"),
                        ReleaseYear = releaseYear
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing movie {MovieId}", item.MovieId);
                    continue;
                }
            }

            var finalResults = movieDetails
                .OrderByDescending(m => m.AverageRating)
                .ThenByDescending(m => m.RatingCount)
                .Take(10)
                .ToList();

            return Ok(new
            {
                Success = true,
                TimePeriod = year.HasValue && month.HasValue
                    ? new DateTime(year.Value, month.Value, 1).ToString("MMMM yyyy", new CultureInfo("bg-BG"))
                    : "All time",
                GenreId = genreId,
                TotalMovies = finalResults.Count,
                Movies = finalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching top rated movies");
            return StatusCode(500, new
            {
                Success = false,
                Message = "An error occurred while processing the request",
                Error = ex.Message
            });
        }
    }

    // DTO класове
    public class MovieRatingDto
    {
        public int MovieId { get; set; }
        public string MovieTitle { get; set; }
        public string PosterPath { get; set; }
        public List<GenreDto> Genres { get; set; }
        public double AverageRating { get; set; } // Локален рейтинг (1-5)
        public double TmdbVoteAverage { get; set; } // TMDB рейтинг (1-10)
        public int RatingCount { get; set; }
        public string LastRated { get; set; }
        public string ReleaseDate { get; set; }
        public int? ReleaseYear { get; set; }
        public List<UserRatingDto> UserRatings { get; set; }
    }

    public class GenreDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class UserRatingDto
    {
        public string UserName { get; set; }
        public double Rating { get; set; }
        public string Review { get; set; }
        public DateTime RatedOn { get; set; }
        public int MovieId { get; internal set; }
        public string MovieTitle { get; internal set; }
        public List<string> MovieGenres { get; internal set; }
    }

    public class RateMovieDto
    {
        [Required(ErrorMessage = "Изисква се идентификатор на филм")]
        public int MovieId { get; set; }

        [Required(ErrorMessage = "Изисква се рейтинг")]
        [Range(1, 5, ErrorMessage = "Рейтингът трябва да е между 1 и 5")]
        public double Rating { get; set; }

        [StringLength(1000, ErrorMessage = "Ревюто не трябва да надвишава 1000 символа")]
        public string? Review { get; set; }
    }

    [HttpDelete("{movieId}")]
    public async Task<IActionResult> DeleteRating(int movieId)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var rating = await _context.MovieRatings
                .FirstOrDefaultAsync(r => r.UserId == userId && r.MovieId == movieId);

            if (rating == null)
            {
                _logger.LogWarning("Опит за изтриване на несъществуващ рейтинг: филм {MovieId}, потребител {UserId}",
                    movieId, userId);
                return NotFound(new
                {
                    Success = false,
                    Message = "Рейтингът не е намерен"
                });
            }

            if (rating.UserId != userId)
            {
                _logger.LogWarning("Опит за изтриване на чужди рейтинги: {CurrentUserId} -> {RatingUserId}",
                    userId, rating.UserId);
                return Forbid();
            }

            _context.MovieRatings.Remove(rating);
            await _context.SaveChangesAsync();

            // Изчистване на кеша
            for (int count = 1; count <= 100; count++)
            {
                _cache.Remove($"recs_{userId}_{count}");
            }

            _logger.LogInformation("Успешно изтрит рейтинг за филм {MovieId} от потребител {UserId}",
                movieId, userId);

            return Ok(new
            {
                Success = true,
                Message = "Рейтингът е изтрит успешно",
                MovieId = movieId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Грешка при изтриване на рейтинг за филм {MovieId}", movieId);
            return StatusCode(500, new
            {
                Success = false,
                Message = "Възникна грешка при обработката на заявката",
                Error = ex.Message
            });
        }
    }
}