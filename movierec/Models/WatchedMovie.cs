using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace movierec.Models
{
    public class WatchedMovie
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public int TmdbMovieId { get; set; }

        public DateTime WatchedOn { get; set; } = DateTime.UtcNow;

        // Променени на nullable (незадължителни)
        public string? MovieTitle { get; set; }  // Добавен "?" за nullable

        public string? PosterPath { get; set; }  // Добавен "?" за nullable

        [ForeignKey(nameof(UserId))]
        public virtual AppUser User { get; set; }
    }
}