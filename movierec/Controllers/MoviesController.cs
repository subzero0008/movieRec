using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;

[Route("api/movies")]
[ApiController]
public class MoviesController : ControllerBase
{
    private readonly TMDbService _tmdbService;
    private readonly ILogger<MoviesController> _logger;

    public MoviesController(TMDbService tmdbService, ILogger<MoviesController> logger)
    {
        _tmdbService = tmdbService;
        _logger = logger;
    }

    [HttpGet("trending")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTrendingMovies()
    {
        try
        {
            var result = await _tmdbService.GetTrendingMoviesAsync();
            return Ok(new
            {
                results = result.Results,
                page = result.Page,
                totalPages = result.TotalPages,
                totalResults = result.TotalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending movies");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMovieDetails(int id)
    {
        try
        {
            var result = await _tmdbService.GetMovieDetailsWithCreditsAsync(id);

            if (result == null || result.Id == 0)
            {
                return NotFound(new { message = "Movie not found" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting movie details for ID {id}");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SearchMovies([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Search query is required" });
        }

        try
        {
            var result = await _tmdbService.SearchMoviesAsync(query);
            return Ok(new
            {
                results = result.Results,
                page = result.Page,
                totalPages = result.TotalPages,
                totalResults = result.TotalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error searching movies for query: {query}");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("genres")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetGenres()
    {
        try
        {
            var result = await _tmdbService.GetMovieGenresAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting movie genres");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("genre/{genreId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMoviesByGenre(int genreId)
    {
        try
        {
            var result = await _tmdbService.GetMoviesByGenreAsync(genreId);

            if (result == null || !result.Results.Any())
            {
                return NotFound(new
                {
                    message = "No movies found for this genre",
                    page = 1,
                    totalPages = 0,
                    totalResults = 0
                });
            }

            return Ok(new
            {
                results = result.Results,
                page = result.Page,
                totalPages = result.TotalPages,
                totalResults = result.TotalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting movies for genre ID {genreId}");
            return StatusCode(500, new
            {
                message = "Internal server error",
                page = 1,
                totalPages = 0,
                totalResults = 0
            });
        }
    }
    [HttpGet("discover")]
    public async Task<IActionResult> DiscoverMovies(
        [FromQuery] string? genres = null,
        [FromQuery] string? sortBy = "popularity.desc",
        [FromQuery] double? minRating = null,
        [FromQuery] int? year = null,
        [FromQuery] string? yearFrom = null,
        [FromQuery] string? yearTo = null,
        [FromQuery] int? maxRuntime = null,
        [FromQuery] string? withCast = null,
        [FromQuery] int? page = 1)
    {
        try
        {
            var parameters = new movierec.Models.DiscoverParams
            {
                Genres = genres,
                SortBy = sortBy ?? "popularity.desc",
                IsRatingImportant = minRating.HasValue,
                MinVoteAverage = minRating,
                PrimaryReleaseYear = year,
                PrimaryReleaseDateGte = yearFrom,
                PrimaryReleaseDateLte = yearTo,
                WithRuntimeLte = maxRuntime,
                WithCast = withCast,
                Page = page
            };
            var result = await _tmdbService.DiscoverMoviesAdvancedAsync(parameters);
            return Ok(new
            {
                results = result.Results,
                page = result.Page,
                totalPages = result.TotalPages,
                totalResults = result.TotalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering movies");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
    [HttpGet("search/person")]
    public async Task<IActionResult> SearchPerson([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(new { message = "Query is required" });
        try
        {
            var result = await _tmdbService.SearchPersonAsync(query);
            return Ok(result.Results.Take(5).Select(p => new { p.Id, p.Name }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching person");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
    [HttpGet("popular")]
    public async Task<IActionResult> GetPopularMovies([FromQuery] int page = 1)
    {
        try
        {
            var result = await _tmdbService.GetPopularMoviesAsync();
            return Ok(new
            {
                results = result.Results,
                page = result.Page,
                totalPages = result.TotalPages,
                totalResults = result.TotalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting popular movies");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("top-rated")]
    public async Task<IActionResult> GetTopRatedMovies([FromQuery] int page = 1)
    {
        try
        {
            var parameters = new movierec.Models.DiscoverParams
            {
                SortBy = "vote_average.desc",
                MinVoteAverage = 7.0,
                Page = page
            };
            var result = await _tmdbService.DiscoverMoviesAdvancedAsync(parameters);
            return Ok(new
            {
                results = result.Results,
                page = result.Page,
                totalPages = result.TotalPages,
                totalResults = result.TotalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top rated movies");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
