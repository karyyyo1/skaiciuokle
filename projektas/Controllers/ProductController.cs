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
        public async Task<IEnumerable<Product>> GetAll()
        {
            var products = await _repository.GetAll(); // Await the task first

            return (IEnumerable<Product>)products.Select(o => _mapper.Map<ProductDto>(o));
        }
        [HttpGet("{id}")]
        public async Task<Product> Get(int id)
        {
            return await _repository.Get(id);
        }
    }
}
