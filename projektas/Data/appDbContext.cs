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
        public DbSet<OrderProduct> OrderProducts { get; set; }
        public DbSet<OrderJob> OrderJobs { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Manager> Manager { get; set; }
        public DbSet<Administrator> Administrators { get; set; }
        public DbSet<Client> Clients { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Table name
            modelBuilder.Entity<Product>()
            .ToTable("products")
            .HasDiscriminator<ProductType>("Type")
            .HasValue<AccessControl>(ProductType.access_control)
            .HasValue<GateEngine>(ProductType.gate_engine)
            .HasValue<Pole>(ProductType.poles)
            .HasValue<Fence>(ProductType.fence)
            .HasValue<Gate>(ProductType.gate)
            .HasValue<Gadget>(ProductType.gadgets);
            modelBuilder.Entity<GateEngine>(entity =>
            {
                entity.Property(e => e.GateType).HasColumnName("gatetype");
                entity.Property(e => e.Fast).HasColumnName("fast");
            });

            // Gate Mappings
            modelBuilder.Entity<Gate>(entity =>
            {
                entity.Property(e => e.GateType).HasColumnName("gatetype");
            });
            modelBuilder.Entity<Fence>(entity =>
            {
                entity.Property(f => f.FillType).HasColumnName("filltype");
            });

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

            modelBuilder.Entity<Document>().ToTable("documents")
            .HasOne(d => d.Order)
            .WithMany(o => o.Documents)
            .HasForeignKey(d => d.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

            // --- Comments ---
            modelBuilder.Entity<Comment>()
                .ToTable("comments")
                .HasOne(c => c.Order)
                .WithMany(o => o.Comments)
                .HasForeignKey(c => c.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Document)
                .WithMany(d => d.DocumentComment)
                .HasForeignKey(c => c.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}