using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
   [Table("order_products")]
    public class OrderProduct
    {
        [ForeignKey(nameof(Order))]
        [Column("order_id")]
        public ulong OrderId { get; set; }

        [ForeignKey(nameof(Product))]
        [Column("product_id")]
        public ulong ProductId { get; set; }

        [Column("quantity")]
        public int Quantity { get; set; } = 1;

        [Column("price_each")]
        [Precision(10, 2)]
        public decimal PriceEach { get; set; }

        // Navigation properties
        public Order Order { get; set; } = null!;
        public Product Product { get; set; } = null!;
    }
}
