using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace ProductStore.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Name is required!")]
        [StringLength(25, ErrorMessage = "Name cannot be more than 25 characters!")]
        public string Name { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public int CategoryID { get; set; }
    }
}