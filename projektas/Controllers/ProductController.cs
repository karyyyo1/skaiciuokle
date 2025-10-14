using Microsoft.AspNetCore.Mvc;
using projektas.Data.repositories;
using projektas.Data.entities;
using projektas.Data.dtos;
using System.Linq;
using AutoMapper;
namespace projektas.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductController : Controller
    {
        private readonly IProductRepository _repository;
        private readonly IMapper _mapper;

        public ProductController(IProductRepository productRepository, IMapper mapper)
        {
            _repository = productRepository;
            _mapper = mapper;
        }
        [HttpGet]
        public async Task<IEnumerable<ProductDto>> GetAll()
        {
            var products = await _repository.GetAll();
            return products.Select(o => _mapper.Map<ProductDto>(o));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> Get(int id)
        {
            var product = await _repository.Get(id);
            if (product == null)
            {
                return NotFound($"Product not found with this id: '{id}' ");
            }

            return Ok(_mapper.Map<ProductDto>(product));
        }
        [HttpPost]
        public async Task<ActionResult<ProductDto>> Post(ProductPostDto productDto)
        {
            Product product = productDto.Type switch
            {
                ProductType.access_control => new Access_control
                {
                    Name = productDto.Name,
                    Description = productDto.Description
                },
                ProductType.gate_engine => new Gate_engines
                {
                    Name = productDto.Name,
                    Description = productDto.Description
                },
                ProductType.gadgets => new Gadgets
                {
                    Name = productDto.Name,
                    Description = productDto.Description
                },
                _ => throw new ArgumentException("Unknown product type")
            };

            await _repository.Create(product);

            return Created($"/api/products/{product.Id}", _mapper.Map<ProductDto>(product));
        }

    }
}
