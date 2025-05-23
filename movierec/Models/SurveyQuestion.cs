namespace MovieRec.Models.DTOs.Survey;

public class SurveyQuestion
{
    public int Id { get; set; }
    public string Text { get; set; }
    public string[] Options { get; set; }
    public string FilterProperty { get; set; }
    public bool IsMultipleChoice { get; set; } = true; 
}