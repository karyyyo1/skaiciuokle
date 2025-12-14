using projektas.Data.entities;

namespace projektas.Data.dto
{
    public class OrderProductDto
    {
        public long ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public bool Done { get; set; } = false;
    }
    public class OrderResponseDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? UserEmail { get; set; }
        public long? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.pending;
        public decimal TotalPrice { get; set; }
        public List<OrderProductDto> OrderProducts { get; set; } = new();
        public List<OrderJobDto> OrderJobs { get; set; } = new();
    }
}
