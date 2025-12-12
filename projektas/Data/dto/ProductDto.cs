using projektas.Data.entities;

namespace projektas.Data.dto
{
    public class ProductDto
    {
        public ulong Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public ProductType Type { get; set; }
        public string? Image { get; set; }
        public int? Width { get; set; }
        public int? Length { get; set; }
        public int? Height { get; set; }
        public int? Quantity { get; set; }
        public string? Color { get; set; }
        public int? FillType { get; set; }
        public int? GateType { get; set; }
        public bool? Fast { get; set; }
        public string? Connection { get; set; }
        public int? Relays { get; set; }
    }
}
