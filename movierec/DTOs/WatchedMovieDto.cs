public class WatchedMovieDto
{
    public int Id { get; set; }
    public int TmdbMovieId { get; set; }
    public string? MovieTitle { get; set; }  // Незадължително
    public string? PosterPath { get; set; }  // Незадължително
    public DateTime WatchedOn { get; set; }
}