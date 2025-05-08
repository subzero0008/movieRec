using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using movierec.Models;
using MovieRecAPI.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Cinema")]
public class CinemaPollsController : ControllerBase
{
    private readonly MovieRecDbContext _context;
    private readonly ILogger<CinemaPollsController> _logger;

    public CinemaPollsController(MovieRecDbContext context, ILogger<CinemaPollsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePoll([FromBody] CreatePollDto pollDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var poll = new CinemaPoll
        {
            Title = pollDto.Title,
            Description = pollDto.Description,
            StartDate = DateTime.UtcNow,
            EndDate = pollDto.EndDate.ToUniversalTime(),
            AppUserId = userId,
            PollOptions = pollDto.Options.Select(o => new PollOption
            {
                MovieId = o.MovieId,
                MovieTitle = o.MovieTitle,
                MoviePosterUrl = o.MoviePosterUrl,
                MovieBackdropUrl = o.MovieBackdropUrl,
                MovieReleaseDate = o.ReleaseDate,
                Overview = o.Overview,
                Votes = 0
            }).ToList()
        };

        await _context.CinemaPolls.AddAsync(poll);
        await _context.SaveChangesAsync();

        return Ok(new { Success = true, PollId = poll.Id });
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActivePolls()
    {
        var polls = await _context.CinemaPolls
            .Where(p => p.StartDate <= DateTime.UtcNow && p.EndDate >= DateTime.UtcNow)
            .Include(p => p.PollOptions)
            .OrderByDescending(p => p.StartDate)
            .Select(p => new PollResponseDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                IsActive = true,
                Options = p.PollOptions.Select(o => new PollOptionResponseDto
                {
                    Id = o.Id,
                    MovieId = o.MovieId,
                    MovieTitle = o.MovieTitle,
                    MoviePosterUrl = o.MoviePosterUrl,
                    Votes = o.Votes
                }).ToList(),
                TotalVotes = p.PollOptions.Sum(o => o.Votes)
            })
            .ToListAsync();

        // Calculate percentages
        polls.ForEach(p => p.Options.ForEach(o =>
            o.Percentage = p.TotalVotes > 0 ? Math.Round((double)o.Votes / p.TotalVotes * 100, 1) : 0));

        return Ok(polls);
    }

    [HttpPost("{pollId}/vote/{optionId}")]
    public async Task<IActionResult> Vote(int pollId, int optionId)
    {
        var option = await _context.PollOptions
            .FirstOrDefaultAsync(o => o.Id == optionId && o.CinemaPollId == pollId);

        if (option == null)
            return NotFound();

        option.Votes++;
        await _context.SaveChangesAsync();

        return Ok(new { Success = true });
    }
}