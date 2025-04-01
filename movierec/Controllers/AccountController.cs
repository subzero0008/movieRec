using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MovieRecAPI.Data;
using movierec.Models;
using System.Threading.Tasks;
using movierec.DTOs;

namespace MovieRecAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;

        public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        // POST: api/account/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (model.Password != model.ConfirmPassword)
            {
                return BadRequest(new { message = "Паролите не съвпадат" });
            }

            var user = new AppUser { UserName = model.Username, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                return Ok(new { message = "Регистрацията е успешна" });
            }
            else
            {
                return BadRequest(new { message = "Неуспешна регистрация", errors = result.Errors });
            }
        }

        // POST: api/account/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (ModelState.IsValid)
            {
                AppUser user;

                // Проверяваме дали въведеният имейл или username е валиден
                if (model.Identifier.Contains('@')) // Проверяваме дали е имейл
                {
                    user = await _userManager.FindByEmailAsync(model.Identifier); // Търсим по имейл
                }
                else
                {
                    user = await _userManager.FindByNameAsync(model.Identifier); // Търсим по потребителско име
                }

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                var result = await _signInManager.PasswordSignInAsync(user, model.Password, false, false);

                if (result.Succeeded)
                {
                    return Ok(new { message = "Login successful" });
                }
                else
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }
            }

            return BadRequest(new { message = "Invalid data" });
        }
    }

    // Модел за входните данни за регистрация
    public class RegisterModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
    }

    // Модел за входните данни за логин
    public class LoginModel
    {
        public string Identifier { get; set; } // Използваме Identifier за имейл или потребителско име
        public string Password { get; set; }
    }
}
