using Microsoft.EntityFrameworkCore;
using projektas.Data.entities;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace projektas.Data.dto
{
    public class OrderDto
    {
        public ulong ClientId { get; set; }
        public ulong? ManagerId { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.pending;
        public decimal TotalPrice { get; set; }
        public List<OrderProductDto> OrderProducts { get; set; } = new();
        public List<DocumentDto> OrderDocument { get; set; } = new();
    }
   
}
