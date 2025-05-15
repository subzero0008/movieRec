public class PollVote
{
    public int Id { get; set; }
    public int PollId { get; set; }
    public Poll Poll { get; set; }
    public int PollMovieId { get; set; }
    public PollMovie PollMovie { get; set; }
    public string UserId { get; set; }
    public DateTime VotedAt { get; set; }
}