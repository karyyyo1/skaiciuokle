using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.dto;
using projektas.Data.entities;

namespace projektas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DocumentsController(AppDbContext context)
        {
            _context = context;
        }
        // GET: api/documents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocuments()
        {
            return await _context.Documents
                                 .Include(d => d.Order)
                                 .ToListAsync();
        }
        // GET: api/documents/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Document>> GetDocument(ulong id)
        {
            var document = await _context.Documents
                                         .Include(d => d.Order)
                                         .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound();
            return Ok(document);
        }
        // POST: api/documents
        [HttpPost]
        public async Task<ActionResult<DocumentResponseDto>> CreateDocument([FromBody] DocumentDto? documentDto)

        {
            if (documentDto == null)
                return BadRequest("Document data is required.");

            if (documentDto.OrderId == 0)
                return BadRequest("OrderId is required.");

            // Ensure the referenced Order exists to avoid FK constraint errors
            var orderExists = await _context.Orders.AnyAsync(o => o.Id == documentDto.OrderId);
            if (!orderExists)
                return BadRequest("OrderId does not exist.");

            if (string.IsNullOrWhiteSpace(documentDto.Name))
                return BadRequest("Document name is required.");

            if (string.IsNullOrWhiteSpace(documentDto.FilePath))
                return BadRequest("FilePath is required.");

            // Map DTO to entity
            var document = new Document
            {
                OrderId = documentDto.OrderId,
                Name = documentDto.Name,
                FilePath = documentDto.FilePath,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync(); // ID is generated here

            // Map entity to response DTO
            var responseDto = new DocumentResponseDto
            {
                Id = document.Id,
                OrderId = document.OrderId,
                Name = document.Name,
                FilePath = document.FilePath,
                CreatedAt = document.CreatedAt,
                UpdatedAt = document.UpdatedAt
            };

            return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, responseDto);
        }

        // PUT: api/documents/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDocument(ulong id, [FromBody] DocumentDto? documentDto)
        {
            if (documentDto == null)
                return BadRequest("Document data is required.");

            var existingDocument = await _context.Documents.FindAsync(id);
            if (existingDocument == null)
                return NotFound();

            // Validate fields if needed
            if (documentDto.OrderId == 0)
                return BadRequest("OrderId is required.");

            // Ensure the referenced Order exists to avoid FK constraint errors
            var orderExists = await _context.Orders.AnyAsync(o => o.Id == documentDto.OrderId);
            if (!orderExists)
                return BadRequest("OrderId does not exist.");

            if (string.IsNullOrWhiteSpace(documentDto.Name))
                return BadRequest("Document name is required.");

            if (string.IsNullOrWhiteSpace(documentDto.FilePath))
                return BadRequest("FilePath is required.");

            // Update fields
            existingDocument.OrderId = documentDto.OrderId;
            existingDocument.Name = documentDto.Name;
            existingDocument.FilePath = documentDto.FilePath;
            existingDocument.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        // DELETE: api/documents/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> DeleteDocument(ulong id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null) return NotFound();

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
