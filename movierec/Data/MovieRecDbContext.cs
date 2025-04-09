using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using movierec.Models;

namespace MovieRecAPI.Data
{
    public class MovieRecDbContext : IdentityDbContext<AppUser, IdentityRole, string>
    {
        public MovieRecDbContext(DbContextOptions<MovieRecDbContext> options)
            : base(options)
        {
        }

        public DbSet<Movie> Movies { get; set; }
        public DbSet<MovieRating> MovieRatings { get; set; } // Добавете това
        public DbSet<FavoriteMovie> FavoriteMovies { get; set; } // Ако използвате
        public DbSet<WatchedMovie> WatchedMovies { get; set; } // Ако използвате

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Конфигурация за WatchedMovie
            builder.Entity<WatchedMovie>()
                .HasOne(w => w.User)
                .WithMany(u => u.WatchedMovies)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}