using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using movierec.Models;  // Обнови с твоята коректна пътека към моделите

namespace MovieRecAPI.Data
{
    public class MovieRecDbContext : IdentityDbContext<AppUser, IdentityRole, string> // Използвай IdentityDbContext
    {
        public MovieRecDbContext(DbContextOptions<MovieRecDbContext> options)
            : base(options)
        {
        }

        public DbSet<Movie> Movies { get; set; } // Добави други DbSet-и тук, ако имаш

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder); // Важно за конфигурация на Identity
        }
    }
}
