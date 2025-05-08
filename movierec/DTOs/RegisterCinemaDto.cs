using System.ComponentModel.DataAnnotations;

namespace movierec.DTOs
{
    public class RegisterCinemaDto
    {
        [Required(ErrorMessage = "Cinema name is required")]
        [StringLength(100, ErrorMessage = "Cinema name cannot exceed 100 characters")]
        public string CinemaName { get; set; }

        [Required(ErrorMessage = "City is required")]
        [StringLength(50, ErrorMessage = "City name cannot exceed 50 characters")]
        public string City { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Confirm Password is required")]
        [Compare("Password", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number")]
        public string PhoneNumber { get; set; }
    }
}