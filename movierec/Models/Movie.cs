using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace movierec.Models
{
    public class Movie
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; } = "Unknown Movie";

        [JsonProperty("poster_path")]
        public string PosterPath { get; set; } = string.Empty;

        [JsonIgnore]
        public string PosterUrl => string.IsNullOrEmpty(PosterPath)
            ? "/images/default-poster.jpg"
            : $"https://image.tmdb.org/t/p/w500{PosterPath}";

        [JsonProperty("release_date")]
        public string ReleaseDate { get; set; } = "1900-01-01";

        [JsonProperty("vote_average")]
        public double VoteAverage { get; set; }

        [JsonProperty("overview")]
        public string Overview { get; set; } = "No overview available";

        [JsonProperty("original_title")]
        public string OriginalTitle { get; set; } = string.Empty;

        [JsonProperty("original_language")]
        public string OriginalLanguage { get; set; } = "en";

        [JsonProperty("popularity")]
        public double Popularity { get; set; }

        [JsonProperty("vote_count")]
        public int VoteCount { get; set; }

        // Двете свойства за жанрове:
        [JsonProperty("genres")]
        public List<GenreInfo> GenreInfo { get; set; } = new List<GenreInfo>();

        [JsonProperty("genre_ids")]
        public List<int> GenreIds { get; set; } = new List<int>();

        // Оптимизирана информация за актьорите
        [JsonProperty("main_cast")]
        public List<CastInfo> MainCast { get; set; } = new List<CastInfo>();

        // Оптимизирана информация за екипа
        [JsonProperty("main_crew")]
        public List<CrewInfo> MainCrew { get; set; } = new List<CrewInfo>();

        [JsonIgnore]
        public string ReleaseYear => GetReleaseYear();

        public string? BackdropPath { get; internal set; }

        private string GetReleaseYear()
        {
            if (string.IsNullOrEmpty(ReleaseDate)) return "N/A";
            if (DateTime.TryParse(ReleaseDate, out DateTime date))
                return date.Year.ToString();
            if (ReleaseDate.Length >= 4)
                return ReleaseDate.Substring(0, 4);
            return "N/A";
        }
    }

    [NotMapped]
    public class GenreInfo
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Genre";
    }

    [NotMapped]
    public class CastInfo
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Actor";
        
        [JsonProperty("character")]
        public string Character { get; set; } = "Unknown Role";

        [JsonProperty("profile_url")]
        public string ProfileUrl { get; set; } = "/images/default-avatar.jpg";
    }

    [NotMapped]
    public class CrewInfo
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Crew";

        [JsonProperty("job")]
        public string Job { get; set; } = "Unknown Job";

        [JsonProperty("profile_url")]
        public string ProfileUrl { get; set; } = "/images/default-avatar.jpg";
    }
}