using System.ComponentModel.DataAnnotations;

namespace movierec.DTOs
{
    public class RoleAssignmentDto
    {
        [Required]
        public string UserId { get; set; }

        [Required]
        public string Role { get; set; }
    }
}
