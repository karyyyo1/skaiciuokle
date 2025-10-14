using AutoMapper;
using projektas.Data.dtos;
using projektas.Data.entities;

namespace projektas.Data
{
    public class DemoRestProduct : Profile 
    {
        public DemoRestProduct() 
        {
            CreateMap<Product, ProductDto>();
            CreateMap<ProductPostDto, Access_control>();
            CreateMap<ProductPostDto, Gate_engines>();
            CreateMap<ProductPostDto, Gadgets>();
        }
    }
}
