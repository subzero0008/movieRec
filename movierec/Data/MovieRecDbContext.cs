using Microsoft.EntityFrameworkCore;
using TMDb.Models;

namespace MovieRecAPI.Data
{
    public class MovieRecDbContext : DbContext
    {
        public MovieRecDbContext(DbContextOptions<MovieRecDbContext> options)
            : base(options)
        {
        }

        public DbSet<Movie> Movies { get; set; } // Добави други таблици тук
    }
}
