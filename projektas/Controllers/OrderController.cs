using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.dto;
using projektas.Data.entities;

namespace projektas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.OrderProducts)
                .ThenInclude(op => op.Product) // Include product details if needed
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var orderDtos = orders.Select(MapToResponseDto).ToList();
            return Ok(orderDtos);
        }

        // GET: api/orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrder(ulong id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderProducts)
                .ThenInclude(op => op.Product) // Include product details if needed
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            var orderDto = MapToResponseDto(order);
            return Ok(orderDto);
        }
        private OrderResponseDto MapToResponseDto(Order order)
        {
            return new OrderResponseDto
            {
                Id = order.Id,
                ClientId = order.ClientId,
                ManagerId = order.ManagerId,
                Status = order.Status,
                TotalPrice = order.TotalPrice,
                OrderProducts = order.OrderProducts?
                    .Select(op => new OrderProductDto
                    {
                        ProductId = op.ProductId,
                        Quantity = op.Quantity,
                        // Add product details if needed:
                        // ProductName = op.Product?.Name,
                        // UnitPrice = op.Product?.Price
                    })
                    .ToList() ?? new List<OrderProductDto>()
            };
        }

        // POST: api/orders
        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] OrderDto? orderDto)
        {
            if (orderDto == null)
                return BadRequest("Order data is required.");

            //  Business validations
            if (orderDto.ClientId <= 0)
                return BadRequest("ClientId must be greater than zero.");

            if (orderDto.ManagerId <= 0)
                return BadRequest("ManagerId must be greater than zero.");

            if (orderDto.TotalPrice <= 0)
                return BadRequest("TotalPrice must be greater than zero.");

            if (orderDto.OrderProducts == null || !orderDto.OrderProducts.Any())
                return BadRequest("At least one product is required in the order.");

            // Map DTO to EF entity
            var order = new Order
            {
                ClientId = orderDto.ClientId,
                ManagerId = orderDto.ManagerId,
                Status = orderDto.Status,
                TotalPrice = orderDto.TotalPrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                OrderProducts = orderDto.OrderProducts
                    .Select(op => new OrderProduct
                    {
                        ProductId = op.ProductId,
                        Quantity = op.Quantity
                    })
                    .ToList()
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(); // order.Id generated
            // Map to response DTO
            var responseDto = new OrderResponseDto
            {
                Id = order.Id,
                ClientId = order.ClientId,
                ManagerId = order.ManagerId,
                Status = order.Status,
                TotalPrice = order.TotalPrice,
                OrderProducts = order.OrderProducts
                    .Select(op => new OrderProductDto
                    {
                        ProductId = op.ProductId,
                        Quantity = op.Quantity
                    })
                    .ToList()
            };
            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, responseDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(ulong id, [FromBody] OrderDto? orderDto)
        {
            if (orderDto == null)
                return BadRequest("Order data is required.");

            // Business validations
            if (orderDto.ManagerId <= 0)
                return BadRequest("ManagerId must be greater than zero.");

            if (orderDto.TotalPrice <= 0)
                return BadRequest("TotalPrice must be greater than zero.");

            var existingOrder = await _context.Orders
                .Include(o => o.OrderProducts)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (existingOrder == null)
                return NotFound();

            // Update fields
            existingOrder.ManagerId = orderDto.ManagerId;
            existingOrder.Status = orderDto.Status;
            existingOrder.TotalPrice = orderDto.TotalPrice;
            existingOrder.UpdatedAt = DateTime.UtcNow;

            // Update products
            existingOrder.OrderProducts.Clear();
            if (orderDto.OrderProducts != null && orderDto.OrderProducts.Any())
            {
                foreach (var opDto in orderDto.OrderProducts)
                {
                    existingOrder.OrderProducts.Add(new OrderProduct
                    {
                        OrderId = existingOrder.Id,
                        ProductId = opDto.ProductId,
                        Quantity = opDto.Quantity
                    });
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }


        // DELETE: api/orders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(ulong id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
