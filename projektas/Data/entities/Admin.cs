using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    [Table("administrators")]
    public class Administrator
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; } // bigint(20) UNSIGNED, AUTO_INCREMENT

        [Required]
        [Column("user_id")]
        public ulong UserId { get; set; } // bigint(20) UNSIGNED, UNIQUE

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } // timestamp NULL

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; } // timestamp NULL

        // Navigation property (optional, if you have a Users table mapped)
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
