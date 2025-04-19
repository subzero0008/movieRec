using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieRecAPI.Services;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace movierec.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Само за логнати потребители
    public class RecommendationsController : ControllerBase
    {
        private readonly RecommendationService _recommendationService;
        private readonly ILogger<RecommendationsController> _logger;
        private readonly IMemoryCache _cache;

        public RecommendationsController(
            RecommendationService recommendationService,
            ILogger<RecommendationsController> logger,
            IMemoryCache cache)
        {
            _recommendationService = recommendationService;
            _logger = logger;
            _cache = cache;
        }

        /// <summary>
        /// Връща персонализирани препоръки за текущия потребител
        /// </summary>
        /// <param name="count">Брой препоръки (1-100, по подразбиране 10)</param>
        [HttpGet("recommendations")]
        public async Task<IActionResult> GetRecommendations(
    [FromQuery, Range(1, 100)] int count = 10)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Unauthorized access attempt");
                    return Unauthorized();
                }

                // Винаги взимаме актуални препоръки без кеш
                var recommendations = await _recommendationService.GetPersonalizedRecommendations(userId, count);

                _logger.LogInformation($"Generated recommendations for user {userId}");

                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating recommendations");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Връща препоръки за конкретен потребител (за администратори)
        /// </summary>
        /// <param name="userId">ID на потребител</param>
        /// <param name="count">Брой препоръки (1-100, по подразбиране 10)</param>
        [HttpGet("{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRecommendationsForUser(
            [Required] string userId,
            [FromQuery, Range(1, 100)] int count = 10)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    _logger.LogWarning("Empty user ID provided");
                    return BadRequest("User ID is required");
                }

                var cacheKey = $"admin_recs_{userId}_{count}";
                if (!_cache.TryGetValue(cacheKey, out var recommendations))
                {
                    recommendations = await _recommendationService.GetPersonalizedRecommendations(userId, count);

                    // Кешираме за 30 минути за административни заявки
                    _cache.Set(cacheKey, recommendations, TimeSpan.FromMinutes(30));

                    _logger.LogInformation($"Admin generated recommendations for user {userId}");
                }

                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Admin error generating recommendations for user {userId}");
                return StatusCode(500, new
                {
                    Error = "Възникна грешка при генериране на препоръки",
                    Details = ex.Message
                });
            }
        }
    }
}