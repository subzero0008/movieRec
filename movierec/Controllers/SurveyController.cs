using Microsoft.AspNetCore.Mvc;
using MovieRec.Models.DTOs.Survey;
using MovieRec.Services;

namespace MovieRec.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SurveyController : ControllerBase
    {
        private readonly SurveyService _surveyService;
        private readonly ILogger<SurveyController> _logger;

        public SurveyController(
            SurveyService surveyService,
            ILogger<SurveyController> logger)
        {
            _surveyService = surveyService;
            _logger = logger;
        }

        /// <summary>
        /// Получава препоръки за филми на база анкетни отговори
        /// </summary>
        [HttpPost("recommendations")]
        public async Task<ActionResult<SurveyResponse>> GetRecommendations([FromBody] SurveyRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _surveyService.GetRecommendationsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Грешка при обработка на анкета");
                return StatusCode(500, "Възникна грешка при генериране на препоръки");
            }
        }

        /// <summary>
        /// Връща въпросите за анкетата с възможности за избор
        /// </summary>
        [HttpGet("questions")]
        public IActionResult GetSurveyQuestions()
        {
            var questions = new[]
            {
        new SurveyQuestion
        {
            Id = 1,
            Text = "How are you feeling today?",
            Options = new[] { "Happy", "Sad", "Neutral", "Excited", "Relaxed" },
            FilterProperty = "mood"
        },
        new SurveyQuestion
        {
            Id = 2,
            Text = "What's your occasion?",
            Options = new[] { "Solo", "Date Night", "Family Time", "Watching with Friends", "Party" },
            FilterProperty = "occasion"
        },
        new SurveyQuestion
        {
            Id = 3,
            Text = "Choose genres you like",
            Options = new[] {
                "Action", "Adventure", "Animation", "Comedy", "Crime",
                "Documentary", "Drama", "Family", "Fantasy", "History",
                "Horror", "Music", "Mystery", "Romance", "Sci-Fi",
                "Thriller", "War", "Western"
            },
            FilterProperty = "genres",
            IsMultipleChoice = true
        },
        new SurveyQuestion
        {
            Id = 4,
            Text = "How old should movies be?",
            Options = new[] { "Last 5 years", "Last 10 years", "Last 25 years", "Doesn't matter" },
            FilterProperty = "agePreference"
        },
        new SurveyQuestion
        {
            Id = 5,
            Text = "Is rating important?",
            Options = new[] { "Yes", "No" },
            FilterProperty = "isRatingImportant"
        },
        new SurveyQuestion
        {
            Id = 6,
            Text = "Select any special categories you're interested in",
            Options = new[] {
                "Based on Book",
                 "Classic Cinema",
                "True Story",
               "Biographical",
               "Superhero Movies"
            },
            FilterProperty = "themes",
            IsMultipleChoice = true
        }
    };

            return Ok(questions);
        }
    }
}