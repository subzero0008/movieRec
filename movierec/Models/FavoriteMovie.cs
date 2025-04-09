using movierec.Models;
using System.ComponentModel.DataAnnotations.Schema;

public class FavoriteMovie
{
    public int Id { get; set; }

    [ForeignKey("User")]
    public string UserId { get; set; }
    public virtual AppUser User { get; set; }

    public int MovieId { get; set; }
    public DateTime AddedOn { get; set; } = DateTime.UtcNow;
}