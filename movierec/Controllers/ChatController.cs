using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace MovieRecAPI.Controllers
{
    [Route("api/chat")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly ILogger<ChatController> _logger;

        public ChatController(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<ChatController> logger)
        {
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
        }

        [HttpPost("movie-expert")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            try
            {
                var apiKey = _configuration["Gemini:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                    return StatusCode(500, new { error = "API key not configured" });

                var systemPrompt = "You are FilmSense AI - an intelligent movie recommendation assistant. Ask clarifying questions about user preferences, suggest diverse movie options, provide detailed information about each film (year, director, cast, plot). Always respond in English. Use emojis for visual emphasis. Format movie recommendations clearly with title, year, and brief description.";

                var contents = new List<object>();
                foreach (var msg in request.Messages)
                {
                    contents.Add(new
                    {
                        role = msg.role == "assistant" ? "model" : "user",
                        parts = new[] { new { text = msg.content } }
                    });
                }

                var payload = new
                {
                    system_instruction = new { parts = new[] { new { text = systemPrompt } } },
                    contents = contents
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
                var response = await _httpClient.PostAsync(url, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Gemini API error: {responseBody}");
                    return StatusCode((int)response.StatusCode, new { error = responseBody });
                }

                var geminiResponse = JsonSerializer.Deserialize<JsonElement>(responseBody);
                var text = geminiResponse
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return Ok(new { text });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini API");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }

    public class ChatRequest
    {
        public List<ChatMessage> Messages { get; set; } = new();
    }

    public class ChatMessage
    {
        public string role { get; set; } = "";
        public string content { get; set; } = "";
    }
}
