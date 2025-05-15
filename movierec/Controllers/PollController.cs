using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieRecAPI.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Linq;

[Route("api/polls")]
[ApiController]
public class PollController : ControllerBase
{
    private readonly MovieRecDbContext _context;
    private readonly TMDbService _tmdbService;
    private readonly ILogger<PollController> _logger;

    public PollController(
        MovieRecDbContext context,
        TMDbService tmdbService,
        ILogger<PollController> logger)
    {
        _context = context;
        _tmdbService = tmdbService;
        _logger = logger;
    }

    [Authorize(Roles = "Cinema,Admin")]
    [HttpPost]
    public async Task<IActionResult> CreatePoll([FromBody] CreatePollDto dto)
    {
        if (dto.MovieIds.Count < 2)
        {
            return BadRequest("Poll must include at least 2 movies");
        }

        var movies = new List<PollMovie>();
        foreach (var movieId in dto.MovieIds)
        {
            var movieDetails = await _tmdbService.GetMovieDetailsAsync(movieId);
            if (movieDetails == null)
            {
                return NotFound($"Movie with ID {movieId} not found in TMDB");
            }

            movies.Add(new PollMovie
            {
                TmdbMovieId = movieId,
                Title = movieDetails.Title,
                PosterPath = movieDetails.PosterPath
            });
        }

        var poll = new Poll
        {
            Title = dto.Title,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Movies = movies
        };

        _context.Polls.Add(poll);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPoll), new { id = poll.Id }, poll);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPoll(int id)
    {
        var poll = await _context.Polls
            .Include(p => p.Movies)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (poll == null)
        {
            return NotFound();
        }

        poll.IsActive = DateTime.UtcNow >= poll.StartDate && DateTime.UtcNow <= poll.EndDate;
        return Ok(poll);
    }

    [HttpGet("{pollId}/vote-status")]
    [Authorize]
    public async Task<IActionResult> GetVoteStatus(int pollId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var hasVoted = await _context.PollVotes
            .AnyAsync(v => v.PollId == pollId && v.UserId == userId);

        return Ok(new { hasVoted });
    }

    [HttpPost("{pollId}/vote/{movieId}")]
    [Authorize]
    public async Task<IActionResult> Vote(int pollId, int movieId)
    {
        var poll = await _context.Polls.FindAsync(pollId);
        if (poll == null)
        {
            return NotFound("Poll not found");
        }

        if (DateTime.UtcNow < poll.StartDate || DateTime.UtcNow > poll.EndDate)
        {
            return BadRequest("This poll is not active");
        }

        var movie = await _context.PollMovies
            .FirstOrDefaultAsync(m => m.PollId == pollId && m.TmdbMovieId == movieId);

        if (movie == null)
        {
            return NotFound("Movie not found in this poll");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var existingVote = await _context.PollVotes
            .FirstOrDefaultAsync(v => v.PollId == pollId && v.UserId == userId);

        if (existingVote != null)
        {
            return BadRequest("You have already voted in this poll");
        }

        var vote = new PollVote
        {
            PollId = pollId,
            PollMovieId = movie.Id,
            UserId = userId
        };

        _context.PollVotes.Add(vote);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("{pollId}/results")]
    [AllowAnonymous]
    public async Task<IActionResult> GetResults(int pollId)
    {
        var poll = await _context.Polls
            .Include(p => p.Movies)
            .ThenInclude(m => m.Votes)
            .FirstOrDefaultAsync(p => p.Id == pollId);

        if (poll == null)
        {
            return NotFound("Poll not found");
        }

        var results = poll.Movies.Select(m => new
        {
            MovieId = m.TmdbMovieId,
            Title = m.Title,
            PosterPath = m.PosterPath,
            Votes = m.Votes.Count
        }).OrderByDescending(r => r.Votes).ToList();

        return Ok(new
        {
            PollId = poll.Id,
            PollTitle = poll.Title,
            TotalVotes = results.Sum(r => r.Votes),
            Results = results
        });
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActivePolls()
    {
        var now = DateTime.UtcNow;
        var polls = await _context.Polls
            .Where(p => p.StartDate <= now && p.EndDate >= now)
            .Include(p => p.Movies)
            .Join(
                _context.Users,  // Join with the Users table
                poll => poll.CreatedByUserId,  // Poll's CreatedByUserId
                user => user.Id,  // User's Id
                (poll, user) => new  // Result selector
                {
                    Poll = poll,
                    CinemaUser = user
                })
            .Select(x => new
            {
                x.Poll.Id,
                x.Poll.Title,
                x.Poll.Description,
                x.Poll.StartDate,
                x.Poll.EndDate,
                x.Poll.IsActive,
                Movies = x.Poll.Movies.Select(m => new
                {
                    m.Id,
                    m.TmdbMovieId,
                    m.Title,
                    m.PosterPath
                }),
                CinemaInfo = new
                {
                    Name = x.CinemaUser.CinemaName,
                    City = x.CinemaUser.City
                }
            })
            .ToListAsync();

        return Ok(polls);
    }
}
