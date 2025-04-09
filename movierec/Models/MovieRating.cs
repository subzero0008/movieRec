using movierec.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

public class MovieRating
{
    public int Id { get; set; }

    [Required]
    [ForeignKey("User")]
    public string UserId { get; set; }

    public virtual AppUser User { get; set; }

    [Required]
    public int MovieId { get; set; } // Това вече е само TMDB ID

    // Премахнато: public virtual Movie Movie { get; set; }

    [Required]
    [Range(1, 5)]
    public double Rating { get; set; }

    public DateTime RatedOn { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "text")]
    [MaxLength(5000)]
    public string Review { get; set; }

    [NotMapped]
    public string MovieTitle { get; set; } // Ще се попълва от TMDB API
}