using projektas.Data.entities;

namespace projektas.Data.dto
{
    public class OrderProductDto
    {
        public ulong ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public bool Done { get; set; } = false;
    }
    public class OrderResponseDto
    {
        public ulong Id { get; set; }
        public ulong UserId { get; set; }
        public string? UserEmail { get; set; }
        public ulong? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.pending;
        public decimal TotalPrice { get; set; }
        public List<OrderProductDto> OrderProducts { get; set; } = new();
        public List<OrderJobDto> OrderJobs { get; set; } = new();
    }
}
