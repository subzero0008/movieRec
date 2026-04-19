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
                // Вземаме ключа от Render Environment Variables
                var apiKey = _configuration["GEMINI_API_KEY"]; 
                if (string.IsNullOrEmpty(apiKey))
                    return StatusCode(500, new { error = "Gemini API key not configured" });

                // Структурата на Gemini изисква "contents" вместо "messages"
                // И "parts" вместо "content"
                var contents = new List<object>();

                // Добавяме системната инструкция като първо съобщение (Gemini 1.5 поддържа системни инструкции)
                // За по-просто тук я добавяме като 'user' съобщение, което описва ролята
                contents.Add(new
                {
                    role = "user",
                    parts = new[] { new { text = "SYSTEM INSTRUCTION: You are FilmSense AI - an intelligent movie recommendation assistant. Always respond in English. Use emojis. Format recommendations clearly." } }
                });
                contents.Add(new { role = "model", parts = new[] { new { text = "Understood. I am ready to assist." } } });

                foreach (var msg in request.Messages)
                {
                    // Gemini разпознава ролите "user" и "model" (вместо "assistant")
                    var role = msg.role == "assistant" ? "model" : "user";
                    contents.Add(new
                    {
                        role = role,
                        parts = new[] { new { text = msg.content } }
                    });
                }

                var payload = new
                {
                    contents = contents,
                    generationConfig = new
                    {
                        maxOutputTokens = 1000,
                        temperature = 0.7
                    }
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // URL адресът на Google Gemini с API ключа като параметър
var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={apiKey}";

                _httpClient.DefaultRequestHeaders.Clear();

                var response = await _httpClient.PostAsync(url, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Gemini API error: {responseBody}");
                    return StatusCode((int)response.StatusCode, new { error = responseBody });
                }

                // Парсваме отговора на Google
                using var doc = JsonDocument.Parse(responseBody);
                var text = doc.RootElement
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
                return StatusCode(500, new { error = "Internal server error: " + ex.Message });
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