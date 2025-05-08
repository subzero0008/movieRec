public class PollOptionResponseDto
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public string MovieTitle { get; set; }
    public string MoviePosterUrl { get; set; }
    public int Votes { get; set; }
    public double Percentage { get; set; }
}