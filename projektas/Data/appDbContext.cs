using Microsoft.EntityFrameworkCore;
using projektas.Data.entities;

namespace projektas.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
        public DbSet<Product> Products { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderJob> OrderJobs { get; set; }
        public DbSet<OrderProduct> OrderProducts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Table name
            modelBuilder.Entity<Product>().ToTable("products");

            // Configure inheritance (Table-per-hierarchy)
            modelBuilder.Entity<Product>()
                .HasDiscriminator<ProductType>("type")
                .HasValue<AccessControl>(ProductType.access_control)
                .HasValue<GateEngine>(ProductType.gate_engine)
                .HasValue<Pole>(ProductType.poles)
                .HasValue<Fence>(ProductType.fence)
                .HasValue<Gate>(ProductType.gate)
                .HasValue<Gadget>(ProductType.gadgets);
            modelBuilder.Entity<Job>().ToTable("jobs");
            modelBuilder.Entity<Order>().ToTable("orders");

            modelBuilder.Entity<OrderJob>()
               .HasKey(oj => new { oj.OrderId, oj.JobId });

            modelBuilder.Entity<OrderProduct>()
                .HasKey(op => new { op.OrderId, op.ProductId });

            modelBuilder.Entity<OrderJob>()
              .HasOne(oj => oj.Order)
              .WithMany(o => o.OrderJobs)
              .HasForeignKey(oj => oj.OrderId);

            modelBuilder.Entity<OrderJob>()
                .HasOne(oj => oj.Job)
                .WithMany()
                .HasForeignKey(oj => oj.JobId);

            modelBuilder.Entity<OrderProduct>()
                .HasOne(op => op.Order)
                .WithMany(o => o.OrderProducts)
                .HasForeignKey(op => op.OrderId);

            modelBuilder.Entity<OrderProduct>()
                .HasOne(op => op.Product)
                .WithMany()
                .HasForeignKey(op => op.ProductId);
        }
    }
}