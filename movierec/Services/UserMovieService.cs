using Microsoft.EntityFrameworkCore;
using movierec.Models;
using MovieRecAPI.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;  // Необходимо е за кеширането

namespace MovieRecAPI.Services
{
    public class UserMovieService
    {
        private readonly MovieRecDbContext _context;
        private readonly IMemoryCache _cache;  // Внедряване на кеша

        public UserMovieService(MovieRecDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        // Добавяне на метод за инвалидиране на кеша
        public void InvalidateCache(string userId)
        {
            var cacheKey = $"preferences_{userId}";
            _cache.Remove(cacheKey);  // Премахване на кеша за потребителя
        }

        // Метод за вземане на рейтинги на потребителя
        public async Task<List<(int MovieId, double Rating)>> GetUserRatings(string userId)
        {
            var ratings = await _context.MovieRatings
                .Where(r => r.UserId == userId)
                .Select(r => new { r.MovieId, r.Rating })
                .ToListAsync();

            return ratings.Select(x => (x.MovieId, x.Rating)).ToList();
        }

        // Метод за обновяване на рейтинга на потребителя
        public async Task UpdateRating(string userId, int movieId, double newRating)
        {
            // Обновяване на рейтинга в базата данни
            var userRating = await _context.MovieRatings
                .FirstOrDefaultAsync(r => r.UserId == userId && r.MovieId == movieId);

            if (userRating != null)
            {
                userRating.Rating = newRating;
                await _context.SaveChangesAsync();
            }

            // Инвалидиране на кеша след обновяване на рейтинга
            InvalidateCache(userId);
        }
    }
}
