using Newtonsoft.Json;
using System.Collections.Generic;

namespace movierec.Models
{
    public class MovieSearchResult
    {
        [JsonProperty("results")]
        public List<Movie> Results { get; set; } = new List<Movie>();
    }
}