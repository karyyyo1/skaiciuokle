/*using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    [Table("order_jobs")]
    public class OrderJob
    {
        [ForeignKey(nameof(Order))]
        [Column("order_id")]
        public ulong OrderId { get; set; }

        [ForeignKey(nameof(Job))]
        [Column("job_id")]
        public ulong JobId { get; set; }

        [Column("price")]
        [Precision(10, 2)]
        public decimal Price { get; set; }

        // Navigation properties
        public Order Order { get; set; } = null!;
      
    }
}*/
