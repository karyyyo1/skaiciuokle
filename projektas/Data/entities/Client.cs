using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    [Table("clients")]
    public class Client
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; } // bigint(20) UNSIGNED

        [Required]
        [Column("user_id")]
        public ulong UserId { get; set; } // bigint(20) UNSIGNED NOT NULL

        [Required]
        [Column("full_name")]
        [MaxLength(255)]
        public string FullName { get; set; } = string.Empty; // varchar(255) NOT NULL

        [Required]
        [Column("address")]
        [MaxLength(500)]
        public string Address { get; set; } = string.Empty; // varchar(500) NOT NULL

        [Required]
        [Column("phone_number")]
        [MaxLength(30)]
        public string PhoneNumber { get; set; } = string.Empty; // varchar(30) NOT NULL

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } // timestamp NULL DEFAULT current_timestamp()

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; } // timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
    }
}
