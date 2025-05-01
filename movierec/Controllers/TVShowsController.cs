using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

[Route("api/tv")]
[ApiController]
public class TVShowsController : ControllerBase
{
    private readonly TMDbService _tmdbService;
    private readonly ILogger<TVShowsController> _logger;

    public TVShowsController(TMDbService tmdbService, ILogger<TVShowsController> logger)
    {
        _tmdbService = tmdbService;
        _logger = logger;
    }

    /// <summary>
    /// Gets trending TV shows
    /// </summary>
    /// <param name="language">Language (default: en-US)</param>
    [HttpGet("trending")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTrending([FromQuery] string language = "en-US")
    {
        try
        {
            var result = await _tmdbService.GetTrendingTVShowsAsync(language);
            return Ok(result.Results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending TV shows");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets TV show details by ID
    /// </summary>
    /// <param name="id">TV show ID</param>
    /// <param name="language">Language (default: en-US)</param>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDetails(int id, [FromQuery] string language = "en-US")
    {
        try
        {
            var result = await _tmdbService.GetTVShowDetailsAsync(id, language);

            if (result == null || result.Id == 0)
            {
                return NotFound(new { message = "TV show not found" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting TV show details for ID {id}");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Searches TV shows by query
    /// </summary>
    /// <param name="query">Search query</param>
    /// <param name="language">Language (default: en-US)</param>
    [HttpGet("search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Search([FromQuery] string query, [FromQuery] string language = "en-US")
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Search query is required" });
        }

        try
        {
            var result = await _tmdbService.SearchTVShowsAsync(query, language);
            return Ok(result.Results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error searching TV shows for query: {query}");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets similar TV shows
    /// </summary>
    /// <param name="id">TV show ID</param>
    /// <param name="language">Language (default: en-US)</param>
    [HttpGet("{id}/similar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSimilar(int id, [FromQuery] string language = "en-US")
    {
        try
        {
            var result = await _tmdbService.GetSimilarTVShowsAsync(id, language);

            if (result == null || result.Results == null || !result.Results.Any())
            {
                return NotFound(new { message = "No similar TV shows found" });
            }

            return Ok(result.Results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting similar TV shows for ID {id}");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets TV show genres
    /// </summary>
    /// <param name="language">Language (default: en-US)</param>
    /// <summary>
    /// Gets TV show genres
    /// </summary>
    /// <param name="language">Language (default: en-US)</param>
    [HttpGet("genres")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetGenres([FromQuery] string language = "en-US")
    {
        try
        {
            var result = await _tmdbService.GetTVShowGenresAsync(language);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting TV show genres");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets TV shows by genre ID
    /// </summary>
    /// <param name="genreId">Genre ID</param>
    /// <param name="language">Language (default: en-US)</param>
    /// <param name="page">Page number (default: 1)</param>
    [HttpGet("genre/{genreId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetByGenre(int genreId, [FromQuery] string language = "en-US", [FromQuery] int page = 1)
    {
        try
        {
            var result = await _tmdbService.GetTVShowsByGenreAsync(genreId, language, page);

            if (result == null || result.Results == null || !result.Results.Any())
            {
                return NotFound(new
                {
                    message = "No TV shows found for this genre",
                    page,
                    totalPages = result?.TotalPages ?? 0,
                    totalResults = result?.TotalResults ?? 0
                });
            }

            return Ok(new
            {
                page = result.Page,
                results = result.Results,
                totalPages = result.TotalPages,
                totalResults = result.TotalResults
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting TV shows for genre ID {genreId}");
            return StatusCode(500, new
            {
                message = "Internal server error",
                page,
                totalPages = 0,
                totalResults = 0
            });
        }
    }
}