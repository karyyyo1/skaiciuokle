using projektas.Data.entities;


namespace projektas.Data.repositories
{
    public interface IProductRepository
    {
        Task<IEnumerable<Product>> GetAll();
        Task<Product> Get(int id);
        Task<Product> Create(Product product);
        Task<Product> Put();
        Task Delete();
    }
    public class ProductsRepositories : IProductRepository
    {
        public async Task<IEnumerable<Product>> GetAll()
        {
            await Task.Delay(10);
            List<Product> products = new List<Product>
            {
               new Access_control
                {
                   Id = 0,
                    Name = "RFID Access Controller",
                    Description = "Access control unit for gates",
                    Price = 199.99m
                },
                new Gate_engines
                {
                    Id = 1,
                    Name = "Sliding Gate Motor",
                    Description = "Motor for sliding gates",
                    Price = 799.50m,
                    Gatetype = GateType.push,
                    fast = true
                },
                new Poles
                {
                    Id = 2,
                    Name = "Steel Pole",
                    Description = "3-meter galvanized steel pole",
                    Price = 150.00m,
                    width = 10,
                    lenght = 10,
                    height = 300
                },
                new Gates
                {
                    Id = 3,
                    Name = "Double Swing Gate",
                    Description = "Automated double gate with sensors",
                    Price = 1200.00m,
                    width = 400,
                    lenght = 50,
                    height = 200,
                    Gatetype = GateType.two_gates
                },
                new Gadgets
                {
                    Id = 4,
                    Name = "GSM Module",
                    Description = "Gate opener via mobile network",
                    Price = 99.99m,
                    Connection = "GSM / Bluetooth"
                }
            };
            return products;
        }
        public async Task<Product> Get(int id)
        {
            await Task.Delay(10); // Simulate async work

            Product product = new Gadgets
            {
                Name = "GSM Module",
                Description = "Gate opener via mobile network",
                Price = 99.99m,
                Connection = "GSM / Bluetooth"
            };

            return product;
        }
        public async Task<Product> Create(Product product)
        {
            await Task.Delay(10);
            return new Gadgets
            {
                Id = product.Id,
                Name = "GSM Module",
                Description = "Gate opener via mobile network",
                Price = 99.99m,
                Connection = "GSM / Bluetooth"
            };
        }
        public async Task<Product> Put()
        {
            return new Gadgets
            {
                Name = "GSM Module",
                Description = "Gate opener via mobile network",
                Price = 99.99m,
                Connection = "GSM / Bluetooth"
            };

        }
        public async Task Delete()
        {

        }
    }
}
