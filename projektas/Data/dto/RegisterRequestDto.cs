using System.ComponentModel.DataAnnotations;

namespace projektas.Data.dto
{
    public class RegisterRequestDto
    {
        [Required]
        [MaxLength(255)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
