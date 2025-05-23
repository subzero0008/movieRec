namespace movierec.Models
{
    public class DiscoverParams
    {
        // Основни параметри
        public string? Genres { get; set; }
        public string? WithKeywords { get; set; }
        public string SortBy { get; set; } = "popularity.desc";

        public string? Occasion { get; set; }
        public string? AgePreference { get; set; }
        public bool IsRatingImportant { get; set; }
        public List<string>? Themes { get; set; }

        public int? PrimaryReleaseYear { get; set; }
        public double? MinVoteAverage { get; set; }
        public int? Page { get; set; }
        public int? PageSize { get; set; }
        public string? PrimaryReleaseDateGte { get; set; }
        public string? PrimaryReleaseDateLte { get; set; }
        public int? WithRuntimeLte { get; set; }
        public string? WithCast { get; set; }
        public string? WithCrew { get; set; }
        public string Language { get; internal set; }

        // Нов помощен метод за конвертиране
        public Dictionary<string, string> ToApiQueryParams()
        {
            var parameters = new Dictionary<string, string>();

            if (!string.IsNullOrEmpty(Genres))
                parameters.Add("with_genres", Genres);

            if (!string.IsNullOrEmpty(WithKeywords))
                parameters.Add("with_keywords", WithKeywords);

            if (!string.IsNullOrEmpty(AgePreference))
            {
                parameters.Add("primary_release_date.gte",
                    AgePreference == "Last 5 years" ? DateTime.Now.AddYears(-5).ToString("yyyy-MM-dd") :
                    AgePreference == "Last 10 years" ? DateTime.Now.AddYears(-10).ToString("yyyy-MM-dd") :
                    "");
            }

            if (IsRatingImportant)
                parameters.Add("vote_average.gte", "7.0");

            // Добавете други параметри според нуждите...

            return parameters;
        }
    }
}