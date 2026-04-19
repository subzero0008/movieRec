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
                var apiKey = _configuration["Groq:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                    return StatusCode(500, new { error = "Groq API key not configured" });

                var messages = new List<object>
                {
                    new {
                        role = "system",
                        content = "You are FilmSense AI - an intelligent movie recommendation assistant. Ask clarifying questions about user preferences, suggest diverse movie options, provide detailed information about each film (year, director, cast, plot). Always respond in English. Use emojis for visual emphasis. Format movie recommendations clearly with title, year, and brief description."
                    }
                };

                foreach (var msg in request.Messages)
                    messages.Add(new { role = msg.role, content = msg.content });

                var payload = new
                {
                    model = "llama-3.3-70b-versatile",
                    messages = messages,
                    max_tokens = 1000,
                    temperature = 0.7
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var response = await _httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Groq API error: {responseBody}");
                    return StatusCode((int)response.StatusCode, new { error = responseBody });
                }

                var groqResponse = JsonSerializer.Deserialize<JsonElement>(responseBody);
                var text = groqResponse
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return Ok(new { text });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Groq API");
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
