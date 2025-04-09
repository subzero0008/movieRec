using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

[Route("api/movies")]
[ApiController]
public class MoviesController : ControllerBase
{
    private readonly TMDbService _tmdbService;

    public MoviesController(TMDbService tmdbService)
    {
        _tmdbService = tmdbService;
    }

    // Маршрут за получаване на тренди филми
    [HttpGet("trending")]
    public async Task<IActionResult> GetTrendingMovies()
    {
        var data = await _tmdbService.GetTrendingMoviesAsync();
        return Ok(data);
    }

    // Маршрут за получаване на детайлна информация за даден филм
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMovieDetails(int id)
    {
        var data = await _tmdbService.GetMovieDetailsWithCreditsAsync(id);  // Променено от GetMovieDetailsAsync на GetMovieDetailsWithCreditsAsync
        if (data == null)
        {
            return NotFound(new { message = "Movie not found" });
        }
        return Ok(data);
    }

    // Нов маршрут за търсене на филми по заглавие
    [HttpGet("search")]
    public async Task<IActionResult> SearchMovies([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Query parameter is required." });
        }

        var data = await _tmdbService.SearchMoviesAsync(query);

        if (data == null || data.Results == null || data.Results.Count == 0)
        {
            return NotFound(new { message = "No movies found." });
        }

        return Ok(data.Results);
    }
}
