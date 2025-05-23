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

        public AdminController(
            UserManager<AppUser> userManager,
            MovieRecDbContext context,
            ILogger<AdminController> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
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

        // PUT: api/admin/users/{id}
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UserUpdateModel model)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Update username if changed
                if (!string.IsNullOrEmpty(model.Username))
                {
                    user.UserName = model.Username;
                }

                // Update password if provided
                if (!string.IsNullOrEmpty(model.NewPassword))
                {
                    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                    var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);
                    if (!result.Succeeded)
                    {
                        return BadRequest(result.Errors);
                    }
                }

                // Save changes
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    return BadRequest(updateResult.Errors);
                }

                return Ok(new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    Roles = await _userManager.GetRolesAsync(user)
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

                return Ok(reviews);
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