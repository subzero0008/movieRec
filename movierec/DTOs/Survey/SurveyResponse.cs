using movierec.Models;

namespace MovieRec.Models.DTOs.Survey;

public class SurveyResponse
{
    public List<Movie> Movies { get; set; } = new();
    public Dictionary<int, string> Explanations { get; set; } = new();
    // Пример: { 123: "Съвпада с вашите избори: Action, High Rating" }
}