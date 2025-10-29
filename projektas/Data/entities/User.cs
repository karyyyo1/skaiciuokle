using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace projektas.Data.entities
{
    public enum UserRole
    {
        admin,
        manager,
        client
    }
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; }  // BIGINT(20) UNSIGNED → ulong in C#

        [Required]
        [Column("username")]
        [MaxLength(255)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Column("email_verified_at")]
        public DateTime? EmailVerifiedAt { get; set; }

        [Required]
        [Column("password")]
        [MaxLength(255)]
        public string Password { get; set; } = string.Empty;

        [Column("remember_token")]
        [MaxLength(100)]
        public string? RememberToken { get; set; }

        [Required]
        [Column("role")]
        public UserRole Role { get; set; } = UserRole.client;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}

