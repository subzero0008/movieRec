using Newtonsoft.Json;

public class Movie
{
    public int Id { get; set; }
    public string Title { get; set; }

    [JsonProperty("poster_path")]
    public string PosterPath { get; set; }

    [JsonProperty("release_date")]
    public string ReleaseDate { get; set; }

    [JsonProperty("vote_average")]
    public double VoteAverage { get; set; }

    public string PosterUrl { get; set; } // Това ще бъде генерирано
}
