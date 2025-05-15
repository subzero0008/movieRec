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
        public DbSet<Poll> Polls { get; set; }
        public DbSet<PollMovie> PollMovies { get; set; }
        public DbSet<PollVote> PollVotes { get; set; }

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

            // Poll configurations
            builder.Entity<Poll>()
                .HasMany(p => p.Movies)
                .WithOne(m => m.Poll)
                .HasForeignKey(m => m.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Poll>()
                .HasMany(p => p.Votes)
                .WithOne(v => v.Poll)
                .HasForeignKey(v => v.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PollMovie>()
                .HasOne(m => m.Poll)
                .WithMany(p => p.Movies)
                .HasForeignKey(m => m.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PollVote>()
                .HasOne(v => v.Poll)
                .WithMany(p => p.Votes)
                .HasForeignKey(v => v.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PollVote>()
                .HasOne(v => v.PollMovie)
                .WithMany(m => m.Votes)
                .HasForeignKey(v => v.PollMovieId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PollVote>()
                .HasIndex(v => new { v.PollId, v.UserId })
                .IsUnique();
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