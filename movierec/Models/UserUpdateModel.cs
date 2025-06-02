namespace movierec.Models
{
    public class UserUpdateModel
    {
        public string Username { get; set; } // Променено на незадължително
        public string NewPassword { get; set; } // Остава незадължително
    }
}