using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace movierec.Models
{
    [NotMapped]
    public class MovieDetails : Movie
    {
        private string _overview;
        private string _releaseDate;
        private string _originalTitle;
        private string _originalLanguage;

        [JsonProperty("runtime")]
        public int? Runtime { get; set; }

        [JsonProperty("tagline")]
        public string Tagline { get; set; } = "No tagline available";

        [JsonProperty("genres")]
        public List<Genre> Genres { get; set; } = new List<Genre>();

        [JsonProperty("credits")]
        public Credits Credits { get; set; } = new Credits();

        [JsonProperty("keywords")]
        public MovieKeywords Keywords { get; set; } = new MovieKeywords();

        [JsonProperty("belongs_to_collection")]
        public CollectionInfo BelongsToCollection { get; set; }

        [JsonProperty("release_date")]
        public new string ReleaseDate
        {
            get => string.IsNullOrEmpty(_releaseDate) ? "1900-01-01" : _releaseDate;
            set => _releaseDate = value;
        }

        [JsonProperty("overview")]
        public string Overview
        {
            get => string.IsNullOrEmpty(_overview) ? "No overview available" : _overview;
            set => _overview = value;
        }

        [JsonProperty("original_title")]
        public string OriginalTitle
        {
            get => string.IsNullOrEmpty(_originalTitle) ? Title : _originalTitle;
            set => _originalTitle = value;
        }

        [JsonProperty("original_language")]
        public string OriginalLanguage
        {
            get => string.IsNullOrEmpty(_originalLanguage) ? "en" : _originalLanguage;
            set => _originalLanguage = value;
        }

        [JsonIgnore]
        public new string PosterUrl =>
            string.IsNullOrEmpty(PosterPath)
                ? "/images/default-poster.jpg"
                : $"https://image.tmdb.org/t/p/w500{PosterPath}";

        [JsonIgnore]
        public string ReleaseYear => GetReleaseYear();

        private string GetReleaseYear()
        {
            if (string.IsNullOrEmpty(ReleaseDate))
                return "N/A";

            if (DateTime.TryParse(ReleaseDate, out DateTime parsedDate))
                return parsedDate.Year.ToString();

            if (ReleaseDate.Length >= 4 && int.TryParse(ReleaseDate.Substring(0, 4), out _))
                return ReleaseDate.Substring(0, 4);

            return "N/A";
        }
    }

    [NotMapped]
    public class CollectionInfo
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Collection";

        [JsonProperty("poster_path")]
        public string PosterPath { get; set; }

        [JsonProperty("backdrop_path")]
        public string BackdropPath { get; set; }

        [JsonIgnore]
        public string PosterUrl =>
            string.IsNullOrEmpty(PosterPath)
                ? "/images/default-poster.jpg"
                : $"https://image.tmdb.org/t/p/w500{PosterPath}";

        [JsonIgnore]
        public string BackdropUrl =>
            string.IsNullOrEmpty(BackdropPath)
                ? "/images/default-backdrop.jpg"
                : $"https://image.tmdb.org/t/p/original{BackdropPath}";
    }

    [NotMapped]
    public class Genre
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Genre";
    }

    [NotMapped]
    public class Credits
    {
        [JsonProperty("cast")]
        public List<CastMember> Cast { get; set; } = new List<CastMember>();

        [JsonProperty("crew")]
        public List<CrewMember> Crew { get; set; } = new List<CrewMember>();

        public List<CrewMember> GetDirectors() =>
            Crew?.Where(c => c.Job.Equals("Director", StringComparison.OrdinalIgnoreCase))
                 .ToList() ?? new List<CrewMember>();
    }

    [NotMapped]
    public class CastMember
    {
        [JsonProperty("id")]
        public int TmdbId { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Actor";

        [JsonProperty("character")]
        public string Character { get; set; } = "Unknown Role";

        [JsonProperty("profile_path")]
        public string ProfilePath { get; set; }

        [JsonIgnore]
        public string ProfileUrl =>
            string.IsNullOrEmpty(ProfilePath)
                ? "/images/default-avatar.jpg"
                : $"https://image.tmdb.org/t/p/w185{ProfilePath}";
    }

    [NotMapped]
    public class CrewMember
    {
        [JsonProperty("id")]
        public int TmdbId { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Crew Member";

        [JsonProperty("job")]
        public string Job { get; set; } = "Unknown Job";

        [JsonProperty("profile_path")]
        public string ProfilePath { get; set; }

        [JsonIgnore]
        public string ProfileUrl =>
            string.IsNullOrEmpty(ProfilePath)
                ? "/images/default-avatar.jpg"
                : $"https://image.tmdb.org/t/p/w185{ProfilePath}";
    }

    [NotMapped]
    public class MovieKeywords
    {
        [JsonProperty("keywords")]
        public List<Keyword> Keywords { get; set; } = new List<Keyword>();
    }

    [NotMapped]
    public class Keyword
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = "Unknown Keyword";
    }
}