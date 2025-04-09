using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieRecAPI.Data;
using movierec.Models;
using movierec.DTOs;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

[Route("api/movieratings")]
[ApiController]
[Authorize]
public class MovieRatingsController : ControllerBase
{
    private readonly MovieRecDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly ILogger<MovieRatingsController> _logger;

    public MovieRatingsController(
        MovieRecDbContext context,
        UserManager<AppUser> userManager,
        ILogger<MovieRatingsController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
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
            // Валидация на userId
            if (!Guid.TryParse(userId, out _))
            {
                _logger.LogWarning("Невалиден формат на потребителския идентификатор: {UserId}", userId);
                return BadRequest(new
                {
                    Success = false,
                    Message = "Невалиден формат на потребителския идентификатор"
                });
            }

            // Проверка за достъп
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId != userId)
            {
                _logger.LogWarning("Опит за достъп до чужди рейтинги: {CurrentUserId} -> {UserId}",
                    currentUserId, userId);
                return Forbid();
            }

            // Базова заявка
            var query = _context.MovieRatings
                .Where(r => r.UserId == userId);

            // Прилагане на филтри
            if (minRating.HasValue)
            {
                query = query.Where(r => r.Rating >= minRating.Value);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(r => r.RatedOn >= fromDate.Value);
            }

            // Пагинация
            var totalCount = await query.CountAsync();
            var ratings = await query
                .OrderByDescending(r => r.RatedOn)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new UserRatingDto
                {
                    MovieId = r.MovieId,
                    Rating = r.Rating,
                    RatedOn = r.RatedOn,
                    Review = r.Review
                })
                .ToListAsync();

            _logger.LogInformation(
                "Върнати {Count} от общо {TotalCount} рейтинга за потребител {UserId}",
                ratings.Count, totalCount, userId);

            return Ok(new
            {
                Success = true,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize,
                Ratings = ratings
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Грешка при получаване на рейтинги за потребител {UserId}", userId);
            return StatusCode(500, new
            {
                Success = false,
                Message = "Възникна грешка при обработката на заявката",
                Error = ex.Message
            });
        }
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

public class UserRatingDto
{
    public int MovieId { get; set; }
    public double Rating { get; set; }
    public DateTime RatedOn { get; set; }
    public string? Review { get; set; }
    public string? MovieTitle { get; set; }
}