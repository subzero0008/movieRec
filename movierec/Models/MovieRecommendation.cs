namespace movierec.Models
{
    public class MovieRecommendation : Movie
    {
        public double RelevanceScore { get; set; }
        public List<SimpleCastMember> MainCast { get; set; } = new List<SimpleCastMember>();
        public List<string> MainGenres { get; set; } = new List<string>();

        public MovieRecommendation() { }

        public MovieRecommendation(MovieDetails movie, double relevanceScore)
        {
            // Основна информация
            Id = movie.Id;
            Title = movie.Title;
            Overview = movie.Overview ?? "No overview available";
            PosterPath = movie.PosterPath;
            ReleaseDate = movie.ReleaseDate ?? "1900-01-01";
            VoteAverage = movie.VoteAverage;
            OriginalTitle = movie.OriginalTitle ?? movie.Title;
            OriginalLanguage = movie.OriginalLanguage ?? "en";

            // Главни актьори (первые 3 от cast)
            MainCast = movie.Credits?.Cast?
                .Take(3)
                .Select(a => new SimpleCastMember
                {
                    Name = a.Name ?? "Unknown Actor",
                    Character = a.Character ?? "Unknown Role"
                })
                .ToList() ?? new List<SimpleCastMember> { new SimpleCastMember() };

            // Главни жанрове (первые 2)
            MainGenres = movie.Genres?
                .Take(2)
                .Select(g => g.Name ?? "Unknown Genre")
                .ToList() ?? new List<string> { "Drama" };

            RelevanceScore = relevanceScore;
        }
    }

    public class SimpleCastMember
    {
        public string Name { get; set; }
        public string Character { get; set; }
    }
}