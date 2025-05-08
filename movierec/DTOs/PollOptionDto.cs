using System.ComponentModel.DataAnnotations;

public class PollOptionDto
{
    [Required]
    public int MovieId { get; set; }

    [Required]
    public string MovieTitle { get; set; }

    [Required]
    public string MoviePosterUrl { get; set; }

    public string MovieBackdropUrl { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string Overview { get; set; }
}