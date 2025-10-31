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
        public async Task<IActionResult> CreateProduct([FromBody] ProductDto dto)
        {
            Product product = dto.Type switch
            {
                ProductType.fence => new Fence
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price,
                    Width = dto.Width,
                    Height = dto.Height,
                    Length = dto.Length,
                    Quantity = dto.Quantity,
                    Color = dto.Color,
                    FillType = (FenceType?)dto.FillType
                },
                ProductType.gate_engine => new GateEngine
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price,
                    GateType = (GateType?)dto.GateType,
                    Fast = dto.Fast
                },
                ProductType.access_control => new AccessControl
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price,
                    Connection = dto.Connection,
                    Relays = dto.Relays
                },
                ProductType.jobs => new Jobs
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price
                },
                _ => throw new NotSupportedException($"Unsupported product type: {dto.Type}")
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return Ok(product);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(ulong id, [FromBody] ProductDto dto)
        {

            var existing = await _context.Products.FindAsync(id);
            if (existing == null) return NotFound();

            // Update base fields
            existing.Name = dto.Name;
            existing.Description = dto.Description;
            existing.Price = dto.Price;
            existing.Width = dto.Width;
            existing.Length = dto.Length;
            existing.Height = dto.Height;
            existing.Color = dto.Color;
            existing.Quantity = dto.Quantity;

            // Type-specific updates
            switch (dto.Type)
            {
                case ProductType.fence:
                    if (existing is Fence fence)
                        fence.FillType = (FenceType?)dto.FillType;
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
                        gate.GateType = (GateType?)dto.GateType;
                    break;

                // Poles or Gadgets might have shared props
                default:
                    break;
            }

            _context.Entry(existing).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
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
