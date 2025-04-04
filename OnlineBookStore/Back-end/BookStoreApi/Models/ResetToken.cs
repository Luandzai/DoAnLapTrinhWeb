using System;

namespace BookStoreApi.Models
{
    public class ResetToken
    {
        public int ResetTokenId { get; set; }  
        public int UserId { get; set; }         
        public string? Token { get; set; }       
        public DateTime ExpiryDate { get; set; } 

        
        public virtual User? User { get; set; }
    }
}
