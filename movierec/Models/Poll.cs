public class Poll
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public string CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<PollMovie> Movies { get; set; }
    public ICollection<PollVote> Votes { get; set; }
}