using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    public enum OrderStatus
    {
        pending,
        processing,
        completed,
        cancelled
    }

    [Table("orders")]
    public class Order
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; } // bigint(20) UNSIGNED → ulong

        [Required]
        [Column("client_id")]
        public ulong ClientId { get; set; }

        [Column("manager_id")]
        public ulong? ManagerId { get; set; }

        [Required]
        [Column("status")]
        public OrderStatus Status { get; set; } = OrderStatus.pending;

        [Column("total_price")]
        [Precision(10, 2)]
        public decimal TotalPrice { get; set; } = 0.00m;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
        public ICollection<OrderJob> OrderJobs { get; set; } = new List<OrderJob>();
        public ICollection<OrderProduct> OrderProducts { get; set; } = new List<OrderProduct>();
    }
}