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
                _context.Users,
                poll => poll.CreatedByUserId,
                user => user.Id,
                (poll, user) => new
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
                createdByUserId = x.Poll.CreatedByUserId, // Добавено ново поле
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
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePoll(int id, [FromBody] UpdatePollDto dto)
    {
        var poll = await _context.Polls
            .Include(p => p.Movies)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (poll == null)
        {
            return NotFound("Poll not found");
        }

        // Проверка дали текущият потребител е създател на анкетата или е Admin
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (poll.CreatedByUserId != currentUserId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        // Основна информация за анкетата
        poll.Title = dto.Title ?? poll.Title;
        poll.Description = dto.Description ?? poll.Description;
        poll.StartDate = dto.StartDate ?? poll.StartDate;
        poll.EndDate = dto.EndDate ?? poll.EndDate;

        // Ако има нови филми
        if (dto.MovieIds != null && dto.MovieIds.Any())
        {
            // Проверка дали има гласувания - ако има, не позволяваме промяна на филмите
            var hasVotes = await _context.PollVotes.AnyAsync(v => v.PollId == id);
            if (hasVotes)
            {
                return BadRequest("Cannot change movies after votes have been cast");
            }

            // Изтриване на старите филми
            _context.PollMovies.RemoveRange(poll.Movies);

            // Добавяне на новите филми
            foreach (var movieId in dto.MovieIds)
            {
                var movieDetails = await _tmdbService.GetMovieDetailsAsync(movieId);
                if (movieDetails == null)
                {
                    return NotFound($"Movie with ID {movieId} not found in TMDB");
                }

                poll.Movies.Add(new PollMovie
                {
                    TmdbMovieId = movieId,
                    Title = movieDetails.Title,
                    PosterPath = movieDetails.PosterPath
                });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(poll);
    }

    [Authorize(Roles = "Cinema,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePoll(int id)
    {
        var poll = await _context.Polls
            .Include(p => p.Movies)
            .ThenInclude(m => m.Votes)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (poll == null)
        {
            return NotFound("Poll not found");
        }

        // Проверка дали текущият потребител е създател на анкетата или е Admin
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (poll.CreatedByUserId != currentUserId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        // Изтриване на всички гласове, свързани с анкетата
        var votes = poll.Movies.SelectMany(m => m.Votes).ToList();
        if (votes.Any())
        {
            _context.PollVotes.RemoveRange(votes);
        }

        // Изтриване на филмите от анкетата
        _context.PollMovies.RemoveRange(poll.Movies);

        // Накрая изтриваме самата анкета
        _context.Polls.Remove(poll);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
