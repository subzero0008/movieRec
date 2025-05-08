using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace movierec.Models
{
    public class PollOption
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MovieId { get; set; }  // TMDB movie ID

        [Required]
        [StringLength(100)]
        public string MovieTitle { get; set; }

        public string MoviePosterUrl { get; set; }

        public int Votes { get; set; } = 0;

        [Required]
        public int CinemaPollId { get; set; }

        [ForeignKey("CinemaPollId")]
        public CinemaPoll CinemaPoll { get; set; }

        public string MovieBackdropUrl { get; set; }
        public DateTime? MovieReleaseDate { get; set; }
        public string Overview { get; set; }
    }
}