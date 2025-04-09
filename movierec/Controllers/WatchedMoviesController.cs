using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using movierec.Models;
using MovieRecAPI.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore; // Това е най-важното
using System.Linq;                  // За LINQ методите
using TMDb.Models;
using Newtonsoft.Json;
using System.Globalization;
using System.Text.RegularExpressions;
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WatchedMoviesController : ControllerBase
{
    private readonly MovieRecDbContext _context;
    private readonly ILogger<WatchedMoviesController> _logger;
    private readonly TMDbService _tmdbService;  // Declare TMDbService

    public WatchedMoviesController(MovieRecDbContext context, ILogger<WatchedMoviesController> logger, TMDbService tmdbService)
    {
        _context = context;
        _logger = logger;
        _tmdbService = tmdbService;  // Assign it in the constructor
    }

    [HttpPost]
    public async Task<IActionResult> AddToWatched([FromBody] AddWatchedMovieDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var existing = await _context.WatchedMovies
                .FirstOrDefaultAsync(w => w.UserId == userId && w.TmdbMovieId == dto.TmdbMovieId);

            if (existing != null)
            {
                return BadRequest(new { Success = false, Message = "Филмът вече е в списъка с гледани" });
            }

            var watchedMovie = new WatchedMovie
            {
                UserId = userId,
                TmdbMovieId = dto.TmdbMovieId,
                MovieTitle = dto.MovieTitle,  // Може да бъде null
                PosterPath = dto.PosterPath,  // Може да бъде null
                WatchedOn = DateTime.UtcNow
            };

            _context.WatchedMovies.Add(watchedMovie);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = "Филмът е добавен успешно",
                Data = new
                {
                    Id = watchedMovie.Id,
                    TmdbMovieId = watchedMovie.TmdbMovieId,
                    WatchedOn = watchedMovie.WatchedOn
                    // Не връщаме MovieTitle и PosterPath ако не са задължителни
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Грешка при добавяне на филм към гледани");
            return StatusCode(500, new { Success = false, Message = "Вътрешна грешка в сървъра" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetWatchedMovies()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { Success = false, Message = "User not authenticated" });
            }

            // (1) Изтриваме проверката за кеш
            var watchedMovies = await _context.WatchedMovies
                .AsNoTracking()
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.WatchedOn)
                .ToListAsync();

            var enrichedMovies = new List<object>();
            var tasks = new List<Task>();

            foreach (var movie in watchedMovies)
            {
                tasks.Add(Task.Run(async () =>
                {
                    try
                    {
                        var tmdbData = await _tmdbService.GetMovieDetailsWithCreditsAsync(movie.TmdbMovieId);
                        var movieResult = new
                        {
                            Id = movie.Id,
                            TmdbMovieId = movie.TmdbMovieId,
                            Title = tmdbData?.Title ?? "Unknown Movie",
                            LocalizedTitle = tmdbData?.Title ?? "Неизвестен филм",
                            PosterUrl = tmdbData?.PosterUrl ?? "/images/default-poster.jpg",
                            Genres = tmdbData?.Genres?.Select(g => g.Name).Take(3).ToList() ?? new List<string> { "Unknown Genre" },
                            Cast = ProcessCastMembers(tmdbData?.Credits?.Cast),
                            ReleaseYear = !string.IsNullOrEmpty(tmdbData?.ReleaseDate)
         ? ExtractReleaseYear(tmdbData.ReleaseDate)
         : "Неизв.",
                            WatchedOn = movie.WatchedOn.ToString("yyyy-MM-ddTHH:mm:ss")
                        };

                        lock (enrichedMovies)
                        {
                            enrichedMovies.Add(movieResult);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error processing movie {movie.TmdbMovieId}");
                    }
                }));
            }

            await Task.WhenAll(tasks);

            enrichedMovies = enrichedMovies
                .OrderByDescending(m => ((dynamic)m).WatchedOn)
                .ToList();

            // (2) Изтриваме запазването в кеша
            return Ok(new { Success = true, Data = enrichedMovies });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching watched movies list");
            return StatusCode(500, new
            {
                Success = false,
                Message = "Internal server error",
                Details = ex.Message
            });
        }
    }

    // Помощни методи
    private List<CastMemberDto> ProcessCastMembers(IEnumerable<CastMember> cast)
    {
        return cast?
            .Where(c => !string.IsNullOrEmpty(c.Name))
            .OrderByDescending(c => !string.IsNullOrEmpty(c.ProfilePath))
            .Take(5)
            .Select(c => new CastMemberDto
            {
                Name = c.Name,
                Character = string.IsNullOrEmpty(c.Character) ? "N/A" : c.Character
            })
            .ToList() ?? new List<CastMemberDto>();
    }

    private string ExtractReleaseYear(string releaseDate)
    {
        if (string.IsNullOrWhiteSpace(releaseDate))
        {
            _logger.LogWarning("Empty or null releaseDate provided");
            return "Неизв.";
        }

        // Опит 1: Парсване като пълна дата (YYYY-MM-DD)
        if (DateTime.TryParse(releaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
        {
            return parsedDate.Year.ToString();
        }

        // Опит 2: Проверка за вече извлечена година (YYYY)
        if (releaseDate.Length == 4 && int.TryParse(releaseDate, out _))
        {
            return releaseDate;
        }

        // Опит 3: Извличане на първите 4 цифри
        var yearMatch = Regex.Match(releaseDate, @"\d{4}");
        if (yearMatch.Success)
        {
            return yearMatch.Value;
        }

        _logger.LogWarning($"Could not extract year from: {releaseDate}");
        return "Неизв.";
    }

    // DTO класове
    public class CastMemberDto
    {
        public string Name { get; set; }
        public string Character { get; set; }
    }





    [HttpDelete("{tmdbMovieId}")]
    public async Task<IActionResult> RemoveFromWatched(int tmdbMovieId)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var watchedMovie = await _context.WatchedMovies
                .FirstOrDefaultAsync(w => w.UserId == userId && w.TmdbMovieId == tmdbMovieId);

            if (watchedMovie == null)
            {
                return NotFound(new { Success = false, Message = "Филмът не е намерен в списъка ви" });
            }

            _context.WatchedMovies.Remove(watchedMovie);
            await _context.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Филмът е премахнат от списъка" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Грешка при премахване на филм от гледани");
            return StatusCode(500, new { Success = false, Message = "Вътрешна грешка в сървъра" });
        }
    }

    [HttpGet("check/{tmdbMovieId}")]
    public async Task<IActionResult> CheckIfWatched(int tmdbMovieId)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var isWatched = await _context.WatchedMovies
                .AnyAsync(w => w.UserId == userId && w.TmdbMovieId == tmdbMovieId);

            return Ok(new { Success = true, IsWatched = isWatched });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Грешка при проверка дали филм е гледан");
            return StatusCode(500, new { Success = false, Message = "Вътрешна грешка в сървъра" });
        }
    }
}