namespace MovieRec.Models.DTOs.Survey;

public class SurveyRequest
{
    public string Mood { get; set; } // "Happy", "Sad", "Neutral"
    public string Occasion { get; set; } // "Movie Date", "Family Night"
    public List<string> Genres { get; set; } = new(); // ["Action", "Comedy"]
    public string AgePreference { get; set; } // "Last 5 years", "Doesn't matter"
    public bool IsRatingImportant { get; set; }
    public List<string> Themes { get; set; } = new(); // ["Spy Movies", "Based on Book"]
}