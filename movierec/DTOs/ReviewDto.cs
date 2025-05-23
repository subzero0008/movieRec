public class ReviewDto
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public string MovieTitle { get; set; } // Ще се попълва от TMDB
    public string UserId { get; set; }
    public string UserName { get; set; }
    public double Rating { get; set; }
    public string ReviewText { get; set; }
    public DateTime RatedOn { get; set; }
}