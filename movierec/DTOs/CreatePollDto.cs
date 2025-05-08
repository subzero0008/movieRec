using System.ComponentModel.DataAnnotations;
public class CreatePollDto
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; }

    [StringLength(500)]
    public string Description { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    [MinLength(2, ErrorMessage = "Трябва да изберете поне 2 филма")]
    [MaxLength(5, ErrorMessage = "Максимум 5 филма на анкета")]
    public List<PollOptionDto> Options { get; set; }
}
