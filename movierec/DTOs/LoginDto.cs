using System.ComponentModel.DataAnnotations;

namespace movierec.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Username or Email is required")]
        public string Identifier { get; set; }  // Може да приема email или username

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; }
    }
}