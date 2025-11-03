using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    [Table("documents")]
    public class Document
    {
        // id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT -> ulong
        [Key]
        [Column("id")]
        public ulong Id { get; set; }

        // order_id BIGINT(20) UNSIGNED NOT NULL -> ulong
        [Required]
        [Column("order_id")]
        public ulong OrderId { get; set; }

        // name VARCHAR(255) NOT NULL
        [Required]
        [Column("name")]
        [StringLength(255)]
        public string Name { get; set; }

        // file_path VARCHAR(500) NOT NULL
        [Required]
        [Column("file_path")]
        [StringLength(500)]
        public string FilePath { get; set; }

        // created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        // updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
        public Order Order { get; set; } = null!;
        public ICollection<Comment> DocumentComment { get; set; } = new List<Comment>();
    }
}
