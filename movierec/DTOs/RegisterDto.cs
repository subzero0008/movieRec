namespace movierec.DTOs
{
    public class RegisterDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; } // Добавяме ConfirmPassword, защото се използва в контролера
    }
}
