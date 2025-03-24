document.addEventListener("DOMContentLoaded", function() {
    const rows = document.querySelectorAll("table tr");
    
    rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        
        row.addEventListener("mouseover", function() {
            this.style.backgroundColor = "#f8f9c5";
        });

        row.addEventListener("mouseout", function() {
            this.style.backgroundColor = "white";
        });
    });
});