using System.ComponentModel.DataAnnotations;

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
    [Compare("Password", ErrorMessage = "Passidents do not match")]
    public string ConfirmPassword { get; set; }

    // Ново поле за избор на тип регистрация
    public bool RegisterAsCinema { get; set; } = false;

    // Допълнителни полета само за киноцентрове (optional)
    public string? CinemaName { get; set; }
    public string? City { get; set; }
    public string? PhoneNumber { get; set; }
}