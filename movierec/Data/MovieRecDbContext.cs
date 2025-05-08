using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using movierec.Models;
using System;

namespace MovieRecAPI.Data
{
    public class MovieRecDbContext : IdentityDbContext<AppUser, IdentityRole, string>
    {
        public MovieRecDbContext(DbContextOptions<MovieRecDbContext> options)
            : base(options)
        {
        }

        public DbSet<Movie> Movies { get; set; }
        public DbSet<MovieRating> MovieRatings { get; set; }
        public DbSet<FavoriteMovie> FavoriteMovies { get; set; }
        public DbSet<WatchedMovie> WatchedMovies { get; set; }
        public DbSet<CinemaPoll> CinemaPolls { get; set; }
        public DbSet<PollOption> PollOptions { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Конфигурация за автоматично преобразуване на всички DateTime свойства към UTC
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(
                            new ValueConverter<DateTime, DateTime>(
                                v => v.ToUniversalTime(),
                                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)));
                    }
                }
            }

            builder.Entity<WatchedMovie>()
                .HasOne(w => w.User)
                .WithMany(u => u.WatchedMovies)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<MovieRating>()
                .HasOne(mr => mr.User)
                .WithMany(u => u.MovieRatings)
                .HasForeignKey(mr => mr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<FavoriteMovie>()
                .HasOne(f => f.User)
                .WithMany(u => u.FavoriteMovies)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<CinemaPoll>()
                .HasOne(cp => cp.AppUser)
                .WithMany(u => u.CinemaPolls)
                .HasForeignKey(cp => cp.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PollOption>()
                .HasOne(po => po.CinemaPoll)
                .WithMany(cp => cp.PollOptions)
                .HasForeignKey(po => po.CinemaPollId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<DateTime>()
                .HaveConversion<DateTimeToUtcConverter>();
        }
    }

    public class DateTimeToUtcConverter : ValueConverter<DateTime, DateTime>
    {
        public DateTimeToUtcConverter()
            : base(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        {
        }
    }
}