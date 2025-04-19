using Newtonsoft.Json;
using System.Collections.Generic;
using movierec.Models;

namespace movierec.Models
{
    public class SimilarMoviesResult
    {
        [JsonProperty("results")]
        public List<Movie> Results { get; set; } = new List<Movie>();

        // Помощен метод за празни резултати
        public static SimilarMoviesResult Empty => new SimilarMoviesResult();
    }




    public class MovieCredits
    {
        [JsonProperty("cast")]
        public List<CastMember> Cast { get; set; } = new List<CastMember>();

        [JsonProperty("crew")]
        public List<CrewMember> Crew { get; set; } = new List<CrewMember>();

        // Помощни методи за работа с екипа
        public List<CrewMember> GetDirectors() =>
            Crew?.Where(c => c.Job == "Director").ToList() ?? new List<CrewMember>();

        public List<string> GetMainActors(int count = 5) =>
            Cast?.Take(count).Select(a => a.Name).ToList() ?? new List<string>(); // Fixed the missing method call "ToList()"
    }
}
    

