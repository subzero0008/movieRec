using Newtonsoft.Json;
using System;

namespace TMDb.Models
{
    public class MovieDetails : Movie
    {
        public int Runtime { get; set; }
        public string Tagline { get; set; }

        [JsonProperty("genres")]
        public List<Genre> Genres { get; set; } = new List<Genre>();

        [JsonProperty("credits")]
        public Credits Credits { get; set; } = new Credits();

        [JsonIgnore]
        public string PosterUrl { get; set; }

        [JsonProperty("release_date")]
        public string ReleaseDate { get; set; }

        [JsonIgnore]
        public string ReleaseYear
        {
            get
            {
                if (string.IsNullOrEmpty(ReleaseDate))
                    return "Неизв.";

                // Опит за парсване на пълна дата (YYYY-MM-DD)
                if (DateTime.TryParse(ReleaseDate, out DateTime parsedDate))
                    return parsedDate.Year.ToString();

                // Опит за извличане на година от низ (ако е във формат YYYY)
                if (ReleaseDate.Length >= 4 && int.TryParse(ReleaseDate.Substring(0, 4), out _))
                    return ReleaseDate.Substring(0, 4);

                return "Неизв.";
            }
        }
    }

    public class Genre
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }
    }

    public class Credits
    {
        [JsonProperty("cast")]
        public List<CastMember> Cast { get; set; } = new List<CastMember>();
    }

    public class CastMember
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("character")]
        public string Character { get; set; }

        [JsonProperty("profile_path")]
        public string ProfilePath { get; set; }
    }
}