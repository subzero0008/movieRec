using System.Collections.Generic;
using Newtonsoft.Json;

namespace YourNamespace.Models  // Заменете с вашия namespace
{
    public class PaginatedResponse<T>
    {
        [JsonProperty("page")]
        public int Page { get; set; }

        [JsonProperty("results")]
        public List<T> Results { get; set; } = new List<T>();

        [JsonProperty("total_pages")]
        public int TotalPages { get; set; }

        [JsonProperty("total_results")]
        public int TotalResults { get; set; }
    }
}