using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace projektas.Data.entities
{
    [Table("managers")]
    public class Manager
    {
        [Key]
        [Column("id")]
        public long Id { get; set; } // bigint(20) SIGNED, AUTO_INCREMENT

        [Required]
        [Column("user_id")]
        public long UserId { get; set; } // bigint(20) SIGNED, UNIQUE

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } // timestamp NULL

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; } // timestamp NULL

        // Navigation property (optional, if you have a Users table mapped)
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
