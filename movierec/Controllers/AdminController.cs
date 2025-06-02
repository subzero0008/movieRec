using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using movierec.Models;
using MovieRecAPI.Data;
using System.Data;

namespace movierec.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly MovieRecDbContext _context;
        private readonly ILogger<AdminController> _logger;
        private readonly TMDbService _tmdbService; // Добави поле за TMDbService

        public AdminController(
            UserManager<AppUser> userManager,
            MovieRecDbContext context,
            ILogger<AdminController> logger,
            TMDbService tmdbService) // Добави TMDbService като параметър
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
            _tmdbService = tmdbService; // Инициализирай полето
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);

                var users = await _userManager.Users
                    .Where(u => u.Id != currentUser.Id)
                    .ToListAsync();

                var userList = new List<object>();

                foreach (var u in users)
                {
                    var roles = await _userManager.GetRolesAsync(u);

                    userList.Add(new
                    {
                        u.Id,
                        u.UserName,
                        u.Email,
                        Roles = roles,
                        u.MemberSince,
                        u.LastActive
                    });
                }

                return Ok(userList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpGet("available-roles")]
        public IActionResult GetAvailableRoles()
        {
            return Ok(new[] { "Admin",  "User", "Cinema" });
        }

        [HttpGet("users-with-roles")]
        public async Task<IActionResult> GetUsersWithRoles()
        {
            try
            {
                var currentUserId = _userManager.GetUserId(User);
                var users = await _userManager.Users
                    .Where(u => u.Id != currentUserId)
                    .Select(u => new
                    {
                        u.Id,
                        u.UserName,
                        u.Email,
                        u.IsCinema,
                        u.CinemaName,
                        u.City,
                        u.PhoneNumber
                    })
                    .ToListAsync();

                var usersWithRoles = new List<object>();

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(await _userManager.FindByIdAsync(user.Id));
                    usersWithRoles.Add(new
                    {
                        user.Id,
                        user.UserName,
                        user.Email,
                        user.IsCinema,
                        user.CinemaName,
                        user.City,
                        user.PhoneNumber,
                        Roles = roles
                    });
                }

                return Ok(usersWithRoles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users with roles");
                return StatusCode(500, "Internal server error");
            }
        }



        // DELETE: api/admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser.Id == id)
                {
                    return BadRequest("Cannot delete yourself");
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                if (await _userManager.IsInRoleAsync(user, "Admin"))
                {
                    return BadRequest("Cannot delete other admins");
                }

                // First delete related data to avoid FK constraints
                await DeleteUserRelatedData(user.Id);

                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user {id}");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPut("users/{id}")]
        [Authorize(Roles = "Admin")] // Само администратори имат достъп
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UserUpdateModel model)
        {
            try
            {
                // 1. Взимаме текущия потребител (администратор, който прави заявката)
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 2. Намираме целевия потребител за редакция
                var userToUpdate = await _userManager.FindByIdAsync(id);
                if (userToUpdate == null)
                {
                    return NotFound("User not found");
                }

                // 3. Проверка дали целевият потребител е администратор И не е текущият потребител
                if (await _userManager.IsInRoleAsync(userToUpdate, "Admin") &&
                    userToUpdate.Id != currentUser.Id)
                {
                    return Forbid("Не можете да редактирате други администратори");
                }

                bool hasChanges = false;

                // 4. Обновяване на потребителско име (ако е предоставено и различно)
                if (model.Username != null && model.Username != userToUpdate.UserName)
                {
                    userToUpdate.UserName = model.Username;
                    hasChanges = true;
                }

                // 5. Обновяване на парола (само ако е предоставена)
                if (!string.IsNullOrWhiteSpace(model.NewPassword))
                {
                    var token = await _userManager.GeneratePasswordResetTokenAsync(userToUpdate);
                    var result = await _userManager.ResetPasswordAsync(userToUpdate, token, model.NewPassword);
                    if (!result.Succeeded)
                    {
                        return BadRequest(result.Errors);
                    }
                }

                // 6. Запазване на промените (ако има такива)
                if (hasChanges)
                {
                    var updateResult = await _userManager.UpdateAsync(userToUpdate);
                    if (!updateResult.Succeeded)
                    {
                        return BadRequest(updateResult.Errors);
                    }
                }

                // 7. Връщане на обновения потребител
                return Ok(new
                {
                    userToUpdate.Id,
                    userToUpdate.UserName,
                    userToUpdate.Email,
                    Roles = await _userManager.GetRolesAsync(userToUpdate)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user {id}");
                return StatusCode(500, "Internal server error");
            }
        }
        // GET: api/admin/reviews
        [HttpGet("reviews")]
    public async Task<IActionResult> GetAllReviews()
    {
        try
        {
            // Първо взимаме всички ревюта от базата
            var reviews = await _context.MovieRatings
                .Include(r => r.User)
                .Select(r => new
                {
                    r.Id,
                    MovieId = r.MovieId,
                    UserId = r.UserId,
                    UserName = r.User.UserName,
                    r.Rating,
                    r.Review,
                    r.RatedOn
                })
                .ToListAsync();

            // Създаваме списък с резултатите, който ще върнем
            var result = new List<object>();

            foreach (var review in reviews)
            {
                string movieTitle = "Unknown Movie";
                
                try
                {
                    // Използваме TMDbService за да вземем заглавието на филма
                    var movieDetails = await _tmdbService.GetMovieDetailsAsync(review.MovieId);
                    movieTitle = movieDetails?.Title ?? $"Unknown Movie (ID: {review.MovieId})";
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error fetching movie title for ID {review.MovieId}");
                    movieTitle = $"Error loading title (ID: {review.MovieId})";
                }

                result.Add(new
                {
                    review.Id,
                    review.MovieId,
                    MovieTitle = movieTitle,
                    review.UserId,
                    review.UserName,
                    review.Rating,
                    review.Review,
                    review.RatedOn
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching reviews");
            return StatusCode(500, "Internal server error");
        }
    }
        [HttpGet("check-admin")]
        public async Task<IActionResult> CheckAdmin()
        {
            try
            {
                // Вземете текущия потребител
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Unauthorized();
                }

                // Проверете дали потребителят е администратор
                var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                return Ok(new { isAdmin });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking admin status");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/admin/reviews/{id}
        [HttpDelete("reviews/{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var review = await _context.MovieRatings.FindAsync(id);
                if (review == null)
                {
                    return NotFound("Review not found");
                }

                _context.MovieRatings.Remove(review);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting review {id}");
                return StatusCode(500, "Internal server error");
            }
        }



    

        private async Task DeleteUserRelatedData(string userId)
        {
            // Delete ratings
            var ratings = _context.MovieRatings.Where(r => r.UserId == userId);
            _context.MovieRatings.RemoveRange(ratings);

            // Delete favorites
            var favorites = _context.FavoriteMovies.Where(f => f.UserId == userId);
            _context.FavoriteMovies.RemoveRange(favorites);

            // Delete watched movies
            var watched = _context.WatchedMovies.Where(w => w.UserId == userId);
            _context.WatchedMovies.RemoveRange(watched);

            await _context.SaveChangesAsync();
        }

       
    }


}