public class PollResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public List<PollOptionResponseDto> Options { get; set; }
    public int TotalVotes { get; set; }
}