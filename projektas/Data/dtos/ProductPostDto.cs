using projektas.Data.entities;
using System.ComponentModel.DataAnnotations;

namespace projektas.Data.dtos
{
    public record ProductPostDto(
     [Required] string Name,
     [Required] string Description,
     [Required] ProductType Type
 );
}
