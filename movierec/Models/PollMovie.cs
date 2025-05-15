public class PollMovie
{
    public int Id { get; set; }
    public int PollId { get; set; }
    public Poll Poll { get; set; }
    public int TmdbMovieId { get; set; }
    public string Title { get; set; }
    public string PosterPath { get; set; }

    public ICollection<PollVote> Votes { get; set; }
}