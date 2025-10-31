using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    [Table("comments")]
    public class Comment
    {
        // id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT -> ulong
        [Key]
        [Column("id")]
        public ulong Id { get; set; }

        // user_id BIGINT(20) UNSIGNED NOT NULL -> ulong
        [Required]
        [Column("user_id")]
        public ulong UserId { get; set; }

        // order_id BIGINT(20) UNSIGNED DEFAULT NULL -> ulong?
        [Column("order_id")]
        public ulong? OrderId { get; set; }

        // document_id BIGINT(20) UNSIGNED DEFAULT NULL -> ulong?
        [Column("document_id")]
        public ulong? DocumentId { get; set; }

        // text TEXT NOT NULL (TEXT is typically mapped to string in C#)
        [Required]
        [Column("text")]
        // No [StringLength] needed as TEXT has no practical C# limit
        public string Text { get; set; } = string.Empty;

        // created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        // updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // --- Navigation Properties ---

        // Foreign Key to users (assuming a User entity exists)
        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public Document Document { get; set; } = null!;

        // Foreign Key to documents.
        public Order Order { get; set; } = null!;
    }

}
