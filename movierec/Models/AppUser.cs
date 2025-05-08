using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations; // Добавено за валидации
using System.ComponentModel.DataAnnotations.Schema;

namespace movierec.Models
{
    public class AppUser : IdentityUser
    {
        // Общи полета за всички потребители
        public string? DisplayName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public DateTime MemberSince { get; set; } = DateTime.UtcNow;
        public DateTime LastActive { get; set; } = DateTime.UtcNow;
        [Column(TypeName = "text")]
        public string? Bio { get; set; }

        // Полета специфични за киноцентровете (nullable, за да не влияят на нормалните потребители)
        [StringLength(100)]
        public string? CinemaName { get; set; }  // Име на киноцентъра

        [StringLength(50)]
        public string? City { get; set; }        // Град, в който се намира киноцентъра

        public bool IsCinema { get; set; } = false; // Флаг дали акаунтът е киноцентър

        // Връзки с други модели
        public virtual ICollection<MovieRating> MovieRatings { get; set; } = new List<MovieRating>();
        public virtual ICollection<FavoriteMovie> FavoriteMovies { get; set; } = new List<FavoriteMovie>();
        public virtual ICollection<WatchedMovie> WatchedMovies { get; set; } = new List<WatchedMovie>();
        
        // Нова колекция за анкети на киноцентъра
        public virtual ICollection<CinemaPoll> CinemaPolls { get; set; } = new List<CinemaPoll>();
    }
}