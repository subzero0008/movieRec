// Backend DTO (ако използвате C#)
using System.ComponentModel.DataAnnotations;

public class AddWatchedMovieDto
{
    [Required(ErrorMessage = "TMDB Movie ID е задължителен")]
    public int TmdbMovieId { get; set; }

    public string? MovieTitle { get; set; }  // Вече не е задължително

    public string? PosterPath { get; set; }  // Вече не е задължително
}