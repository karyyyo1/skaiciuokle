/*using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    [Table("jobs")]
    public class Job
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; } // bigint(20) UNSIGNED → ulong

        [Required]
        [Column("name")]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("price")]
        [Precision(10, 2)] // EF Core 6+ attribute for decimal precision
        public decimal Price { get; set; } = 0.00m;
    }
}*/