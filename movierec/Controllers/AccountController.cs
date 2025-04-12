using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MovieRecAPI.Data;
using movierec.Models;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using System;

namespace MovieRecAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly IConfiguration _configuration;

        public AccountController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        // POST: api/account/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (model.Password != model.ConfirmPassword)
                return BadRequest("Passwords do not match");

            var user = new AppUser
            {
                UserName = model.Username,
                Email = model.Email
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                return Ok(new { message = "Registration successful" });
            }

            return BadRequest(result.Errors);
        }

        // POST: api/account/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = model.Identifier.Contains('@')
                ? await _userManager.FindByEmailAsync(model.Identifier)
                : await _userManager.FindByNameAsync(model.Identifier);

            if (user == null)
                return Unauthorized("Invalid credentials");

            var result = await _signInManager.PasswordSignInAsync(
                user,
                model.Password,
                isPersistent: false,
                lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                    return Unauthorized("Account locked. Try again later.");

                return Unauthorized("Invalid credentials");
            }

            // Генериране на JWT токен
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["JwtSettings:JwtKey"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim(ClaimTypes.Name, user.UserName)
                }),
                Issuer = _configuration["JwtSettings:JwtIssuer"],
                Audience = _configuration["JwtSettings:JwtAudience"],
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:JwtExpireMinutes"])),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtToken = tokenHandler.WriteToken(token);

            // Записване на токена в HTTP-only бисквитка
            Response.Cookies.Append("access_token", jwtToken, new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict,
                Expires = tokenDescriptor.Expires
            });

            // Връщане на токена и в тялото на отговора за фронтенда
            return Ok(new
            {
                message = "Login successful",
                user = new
                {
                    userName = user.UserName,
                    email = user.Email,
                    id = user.Id
                },
                token = jwtToken // Добавен токен за фронтенда
            });
        }

        // POST: api/account/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            Response.Cookies.Delete("access_token");
            return Ok(new { message = "Logout successful" });
        }

        // GET: api/account/currentuser (допълнително)
        [HttpGet("currentuser")]
        [Authorize]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userName = User.FindFirstValue(ClaimTypes.Name);
            var userEmail = User.FindFirstValue(JwtRegisteredClaimNames.Email);

            return Ok(new
            {
                id = userId,
                userName,
                email = userEmail
            });
        }
        [HttpPut("update-profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
        {
            if (string.IsNullOrWhiteSpace(model.NewUsername) && string.IsNullOrWhiteSpace(model.NewPassword))
                return BadRequest("No changes provided");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("User not found");

            // Потвърждение на текущата парола
            var passwordValid = await _userManager.CheckPasswordAsync(user, model.CurrentPassword);
            if (!passwordValid)
                return BadRequest("Invalid current password");

            IdentityResult? passwordChangeResult = null;
            IdentityResult? usernameChangeResult = null;

            // Промяна на username
            if (!string.IsNullOrWhiteSpace(model.NewUsername) && model.NewUsername != user.UserName)
            {
                var existingUser = await _userManager.FindByNameAsync(model.NewUsername);
                if (existingUser != null)
                    return BadRequest("Username is already taken");

                user.UserName = model.NewUsername;
                usernameChangeResult = await _userManager.UpdateAsync(user);
                if (!usernameChangeResult.Succeeded)
                    return BadRequest(usernameChangeResult.Errors);
            }

            // Промяна на парола
            if (!string.IsNullOrWhiteSpace(model.NewPassword))
            {
                passwordChangeResult = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
                if (!passwordChangeResult.Succeeded)
                    return BadRequest(passwordChangeResult.Errors);
            }

            return Ok(new
            {
                message = "Profile updated successfully",
                username = user.UserName
            });
        }
    }

        public class RegisterDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(20, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 20 characters")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Confirm Password is required")]
        [Compare("Password", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; }
    }

    public class LoginDto
    {
        [Required(ErrorMessage = "Username or Email is required")]
        public string Identifier { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; }
    }
}