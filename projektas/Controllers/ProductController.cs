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
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetAll()
        {
            var products = await _context.Products.ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> Get(ulong id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }
        [HttpPost]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> CreateProduct([FromBody] ProductDto dto)
        {
            // ✅ Validate DTO
            if (dto == null)
                return BadRequest("Product data is required.");

            if (dto.Price <= 0)
                return BadRequest("Price must be greater than zero.");

            if (dto.Quantity < 0)
                return BadRequest("Quantity cannot be negative.");

            try
            {
                Product product = dto.Type switch
                {
                    ProductType.fence => new Fence
                    {
                        Name = dto.Name,
                        Description = dto.Description,
                        Price = dto.Price,
                        Image = dto.Image,
                        Quantity = dto.Quantity,
                        Color = dto.Color,
                        FillType = (FenceType?)dto.FillType
                    },
                    ProductType.gate_engine => new GateEngine
                    {
                        Name = dto.Name,
                        Description = dto.Description,
                        Price = dto.Price,
                        Image = dto.Image,
                        Quantity = dto.Quantity,
                        Color = dto.Color,
                        GateType = (GateType?)dto.GateType,
                        Fast = dto.Fast
                    },
                    ProductType.access_control => new AccessControl
                    {
                        Name = dto.Name,
                        Description = dto.Description,
                        Price = dto.Price,
                        Image = dto.Image,
                        Quantity = dto.Quantity,
                        Color = dto.Color,
                        Connection = dto.Connection,
                        Relays = dto.Relays
                    },
                    ProductType.poles => new Pole
                    {
                        Name = dto.Name,
                        Description = dto.Description,
                        Price = dto.Price,
                        Image = dto.Image,
                        Quantity = dto.Quantity,
                        Color = dto.Color,
                        Width = dto.Width,
                        Length = dto.Length,
                        Height = dto.Height
                    },
                    ProductType.gate => new Gate
                    {
                        Name = dto.Name,
                        Description = dto.Description,
                        Price = dto.Price,
                        Image = dto.Image,
                        Quantity = dto.Quantity,
                        Color = dto.Color,
                        GateType = (GateType?)dto.GateType
                    },
                    ProductType.gadgets => new Gadget
                    {
                        Name = dto.Name,
                        Description = dto.Description,
                        Price = dto.Price,
                        Image = dto.Image,
                        Quantity = dto.Quantity,
                        Color = dto.Color,
                        Connection = dto.Connection,
                        Relays = dto.Relays
                    },
                    _ => throw new NotSupportedException($"Unsupported product type: {dto.Type}")
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
            }
            catch (NotSupportedException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, $"Database error: {ex.InnerException?.Message ?? ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Unexpected error: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,manager")]
        public async Task<ActionResult> Update(ulong id, [FromBody] ProductDto dto)
        {
            if (dto == null)
                return BadRequest("Product data is required.");

            if (dto.Price <= 0)
                return BadRequest("Price must be greater than zero.");

            if (dto.Quantity < 0)
                return BadRequest("Quantity cannot be negative.");

            var existing = await _context.Products.FindAsync(id);
            if (existing == null) return NotFound();

            try
            {
                // Update base fields (common to all products)
                existing.Name = dto.Name;
                existing.Description = dto.Description;
                existing.Price = dto.Price;
                existing.Image = dto.Image;
                existing.Color = dto.Color;
                existing.Quantity = dto.Quantity;

                // Type-specific updates
                switch (dto.Type)
                {
                    case ProductType.fence:
                        if (existing is Fence fence)
                        {
                            fence.FillType = (FenceType?)dto.FillType;
                        }
                        break;

                    case ProductType.gate_engine:
                        if (existing is GateEngine engine)
                        {
                            engine.GateType = (GateType?)dto.GateType;
                            engine.Fast = dto.Fast;
                        }
                        break;

                    case ProductType.access_control:
                        if (existing is AccessControl access)
                        {
                            access.Connection = dto.Connection;
                            access.Relays = dto.Relays;
                        }
                        break;

                    case ProductType.gate:
                        if (existing is Gate gate)
                        {
                            gate.GateType = (GateType?)dto.GateType;
                            gate.Height = dto.Height;
                            gate.Width = dto.Width;
                        }
                        break;

                    case ProductType.poles:
                        if (existing is Pole pole)
                        {
                            pole.Width = dto.Width;
                            pole.Length = dto.Length;
                            pole.Height = dto.Height;
                        }
                        break;

                    case ProductType.gadgets:
                        if (existing is Gadget gadget)
                        {
                            gadget.Connection = dto.Connection;
                            gadget.Relays = dto.Relays;
                        }
                        break;

                    default:
                        break;
                }

                _context.Entry(existing).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating product: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> Delete(ulong id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
