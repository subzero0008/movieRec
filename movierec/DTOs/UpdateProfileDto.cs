using System.ComponentModel.DataAnnotations;

public class UpdateProfileDto
{
    public string? NewUsername { get; set; }

    [Required(ErrorMessage = "Current password is required")]
    public string CurrentPassword { get; set; }

    public string? NewPassword { get; set; }
}
