using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace movierec.Models
{
    public class AppUser : IdentityUser
    {
        // Рейтинги на потребителя
        public virtual ICollection<MovieRating> MovieRatings { get; set; } = new List<MovieRating>();

        // Любими филми (за бъдещо разширяване)
        public virtual ICollection<FavoriteMovie> FavoriteMovies { get; set; } = new List<FavoriteMovie>();

        // История на гледанията (за бъдещо разширяване)
        public virtual ICollection<WatchedMovie> WatchedMovies { get; set; } = new List<WatchedMovie>();

        // Допълнителна информация за потребителя
        public string? DisplayName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public DateTime MemberSince { get; set; } = DateTime.UtcNow;
        public DateTime LastActive { get; set; } = DateTime.UtcNow;

        // Биография/описание
        [Column(TypeName = "text")]
        public string? Bio { get; set; }
    }
}