using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.dto;
using projektas.Data.entities;

namespace projektas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
            // Get current user ID and role from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userRoleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !ulong.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Build query based on role
            var query = _context.Orders
                .Include(o => o.OrderProducts)
                .ThenInclude(op => op.Product)
                .Include(o => o.OrderJobs)
                .ThenInclude(oj => oj.Job)
                .AsQueryable();

            // Load managers with their user data for name lookup
            var managers = await _context.Manager
                .Include(m => m.User)
                .ToDictionaryAsync(m => m.Id, m => m.User?.Username);

            // Load users for email lookup
            var users = await _context.Users
                .ToDictionaryAsync(u => u.Id, u => u.Email);

            // Filter orders based on role
            if (userRoleClaim == "client" || userRoleClaim == "3")
            {
                // Clients see only their own orders
                query = query.Where(o => o.UserId == userId);
            }
            else if (userRoleClaim == "manager" || userRoleClaim == "2" || userRoleClaim == "Manager")
            {
                // Managers see only orders assigned to them
                // orders.manager_id references users.id (via Manager.UserId)
                query = query.Where(o => o.ManagerId == userId);
            }
            // Admin sees all orders (no filter needed)

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var orderDtos = orders.Select(o => MapToResponseDto(o, managers, users)).ToList();
            return Ok(orderDtos);
        }

        // GET: api/orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrder(ulong id)
        {
            // Get current user ID and role from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userRoleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !ulong.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var order = await _context.Orders
                .Include(o => o.OrderProducts)
                .ThenInclude(op => op.Product)
                .Include(o => o.OrderJobs)
                .ThenInclude(oj => oj.Job)
                .FirstOrDefaultAsync(o => o.Id == id);

            // Load manager name if exists
            var managers = await _context.Manager
                .Include(m => m.User)
                .ToDictionaryAsync(m => m.Id, m => m.User?.Username);

            // Load users for email lookup
            var users = await _context.Users
                .ToDictionaryAsync(u => u.Id, u => u.Email);

            if (order == null)
                return NotFound();

            // If user is a client, verify they own this order
            if (userRoleClaim == "client" || userRoleClaim == "3")
            {
                // Verify the order belongs to this user (orders.user_id references users.id)
                if (order.UserId != userId)
                {
                    return Forbid(); // 403 Forbidden - order exists but user can't access it
                }
            }

            var orderDto = MapToResponseDto(order, managers, users);
            return Ok(orderDto);
        }

        // GET: api/orders/comments/by-document/{documentId}
        [HttpGet("comments/by-document/{documentId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetCommentsByDocument(ulong documentId)
        {
            var documentExists = await _context.Documents.AnyAsync(d => d.Id == documentId);
            if (!documentExists) return NotFound("Document not found");

            var comments = await _context.Comments
                .Where(c => c.DocumentId == documentId)
                .Include(c => c.User)
                .Include(c => c.Document)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(comments);
        }
        private OrderResponseDto MapToResponseDto(Order order, Dictionary<ulong, string?> managers, Dictionary<ulong, string> users)
        {
            string? managerName = null;
            if (order.ManagerId.HasValue && managers.ContainsKey(order.ManagerId.Value))
            {
                managerName = managers[order.ManagerId.Value];
            }

            string? userEmail = null;
            if (users.ContainsKey(order.UserId))
            {
                userEmail = users[order.UserId];
            }

            return new OrderResponseDto
            {
                Id = order.Id,
                UserId = order.UserId,
                UserEmail = userEmail,
                ManagerId = order.ManagerId,
                ManagerName = managerName,
                Status = order.Status,
                TotalPrice = order.TotalPrice,
                OrderProducts = order.OrderProducts?
                    .Select(op => new OrderProductDto
                    {
                        ProductId = op.ProductId,
                        Quantity = op.Quantity,
                        Done = op.done
                    })
                    .ToList() ?? new List<OrderProductDto>(),
                OrderJobs = order.OrderJobs?
                    .Select(oj => new OrderJobDto
                    {
                        JobId = oj.JobId,
                        Price = oj.Price,
                        Done = oj.Done
                    })
                    .ToList() ?? new List<OrderJobDto>()
            };
        }

        // POST: api/orders
        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] OrderDto? orderDto)
        {
            try
            {
                if (orderDto == null)
                    return BadRequest("Order data is required.");

            //  Business validations
            if (orderDto.UserId <= 0)
                return BadRequest("UserId must be greater than zero.");

            // ManagerId is optional for client order requests (will be assigned by admin/manager later)
            if (orderDto.ManagerId.HasValue && orderDto.ManagerId.Value <= 0)
                return BadRequest("ManagerId must be greater than zero if provided.");

            // Validate that manager exists if provided
            // Note: ManagerId should be the User ID of a manager, not the Manager table ID
            if (orderDto.ManagerId.HasValue)
            {
                var managerExists = await _context.Manager.AnyAsync(m => m.UserId == orderDto.ManagerId.Value);
                if (!managerExists)
                    return BadRequest($"Manager with User ID {orderDto.ManagerId.Value} does not exist.");
            }

            // Allow TotalPrice of 0 for client order requests (will be calculated later)
            if (orderDto.TotalPrice < 0)
                return BadRequest("TotalPrice cannot be negative.");

            // Allow empty OrderProducts for client order requests (will be added by admin/manager)
            // if (orderDto.OrderProducts == null || !orderDto.OrderProducts.Any())
            //     return BadRequest("At least one product is required in the order.");

            // Map DTO to EF entity
            Console.WriteLine($"Creating order with UserId: {orderDto.UserId}, ManagerId: {orderDto.ManagerId}, Status: {orderDto.Status}");
            
            var order = new Order
            {
                UserId = orderDto.UserId,
                ManagerId = orderDto.ManagerId,
                Status = orderDto.Status,
                TotalPrice = orderDto.TotalPrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                OrderProducts = orderDto.OrderProducts != null && orderDto.OrderProducts.Any()
                    ? orderDto.OrderProducts.Select(op => new OrderProduct
                    {
                        ProductId = op.ProductId,
                        Quantity = op.Quantity,
                        done = op.Done
                    }).ToList()
                    : new List<OrderProduct>(),
                OrderJobs = orderDto.OrderJobs != null && orderDto.OrderJobs.Any()
                    ? orderDto.OrderJobs.Select(oj => new OrderJob
                    {
                        JobId = oj.JobId,
                        Price = oj.Price,
                        Done = oj.Done
                    }).ToList()
                    : new List<OrderJob>()
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(); // order.Id generated
            // Load manager name if exists
            var managers = await _context.Manager
                .Include(m => m.User)
                .ToDictionaryAsync(m => m.Id, m => m.User?.Username);

            // Load users for email lookup
            var users = await _context.Users
                .ToDictionaryAsync(u => u.Id, u => u.Email);

            // Map to response DTO
            var responseDto = MapToResponseDto(order, managers, users);
            
            Console.WriteLine($"Order created successfully with ID: {order.Id}");
            return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating order: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Internal server error", error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(ulong id, [FromBody] OrderDto? orderDto)
        {
            if (orderDto == null)
                return BadRequest("Order data is required.");

            // Business validations
            if (orderDto.ManagerId.HasValue && orderDto.ManagerId.Value <= 0)
                return BadRequest("ManagerId must be greater than zero if provided.");

            // Validate that manager exists if provided
            // Note: ManagerId should be the User ID of a manager, not the Manager table ID
            if (orderDto.ManagerId.HasValue)
            {
                var managerExists = await _context.Manager.AnyAsync(m => m.UserId == orderDto.ManagerId.Value);
                if (!managerExists)
                    return BadRequest($"Manager with User ID {orderDto.ManagerId.Value} does not exist.");
            }

            if (orderDto.TotalPrice < 0)
                return BadRequest("TotalPrice cannot be negative.");

            var existingOrder = await _context.Orders
                .Include(o => o.OrderProducts)
                .Include(o => o.OrderJobs)
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
                        Quantity = opDto.Quantity,
                        done = opDto.Done
                    });
                }
            }

            // Update jobs
            existingOrder.OrderJobs.Clear();
            if (orderDto.OrderJobs != null && orderDto.OrderJobs.Any())
            {
                foreach (var ojDto in orderDto.OrderJobs)
                {
                    existingOrder.OrderJobs.Add(new OrderJob
                    {
                        OrderId = existingOrder.Id,
                        JobId = ojDto.JobId,
                        Price = ojDto.Price,
                        Done = ojDto.Done
                    });
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }


        // DELETE: api/orders/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,manager")]
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
