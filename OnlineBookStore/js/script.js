// Hàm lấy danh mục
async function fetchCategories() {
  try {
    const response = await fetch("../data/categories.json");
    const categories = await response.json();
    const categoryList = document.getElementById("category-list");

    categoryList.innerHTML = categories
      .map(
        (category) => `
          <div class="nav__dropdown-item">
            <a href="../html/book-list.html?categoryId=${category.categoryID}">
              ${category.categoryName}
            </a>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching categories:", error);
    document.getElementById("category-list").innerHTML =
      '<div class="nav__dropdown-item">Lỗi tải danh mục</div>';
  }
}

// Hàm fetch và hiển thị sách
async function fetchBooks() {
  try {
    const response = await fetch("../data/books.json");
    const books = await response.json();
    const flashSaleContainer = document.querySelector(".flash-sale__book-list");
    const featuredBooksContainer = document.querySelector(
      ".featured-books__book-list"
    );
    const newBooksContainer = document.querySelector(".new-books__book-list");

    // Biến đếm số lượng sách cho từng phần
    let flashSaleCount = 0;
    let featuredBooksCount = 0;
    let newBooksCount = 0;

    books.forEach((book) => {
      const bookHTML = `
        <div class="book-item">
          <a href="../html/book-detail.html?id=${book.bookID}">
            <img src="${book.coverImage}" alt="Book Cover" />
          </a>
          <h3 class="book-name">${book.title}</h3>
          <div class="Gia">
            <span class="GiaHienTai">${formatPrice(
              book.discountPrice || book.price
            )}</span>
            ${
              book.discountPrice
                ? `<span class="discount">${calculateDiscount(
                    book.price,
                    book.discountPrice
                  )}%</span>`
                : ""
            }
          </div>
          ${
            book.oldPrice
              ? `<span class="GiaCu">${formatPrice(book.oldPrice)}</span>`
              : ""
          }
          <div class="DaBan">Đã bán ${book.soldQuantity || 0}</div>
        </div>
      `;

      if (flashSaleCount < 4 && book.discountPrice) {
        flashSaleContainer.innerHTML += bookHTML;
        flashSaleCount++;
      } else if (book.soldQuantity > 100 && featuredBooksCount < 8) {
        featuredBooksContainer.innerHTML += bookHTML;
        featuredBooksCount++;
      }
      // New Books: Thêm tất cả sách, tối đa 16 sách
      if (newBooksCount < 16) {
        newBooksContainer.innerHTML += bookHTML;
        newBooksCount++;
      }
    });
  } catch (error) {
    console.error("Error fetching books:", error);
  }
}

// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Hàm tính phần trăm giảm giá
function calculateDiscount(originalPrice, discountPrice) {
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

// Hàm countdown timer
function startTimer() {
  const timerElement = document.querySelector(".flash-sale__time");
  let timeLeft = 54 * 60 + 11; // 54 phút 11 giây
  setInterval(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${String(hours).padStart(2, "0")} : ${String(
      minutes
    ).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`;
    timeLeft--;
    if (timeLeft < 0) timeLeft = 54 * 60 + 11;
  }, 1000);
}

// Xử lý ô tìm kiếm
function handleSearch() {
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const keyword = searchInput.value.trim();
      if (keyword) {
        window.location.href = `../html/book-list.html?search=${encodeURIComponent(
          keyword
        )}`;
      }
    }
  });
}

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", () => {
  fetchCategories();
  fetchBooks();
  startTimer();
  handleSearch(); // Thêm xử lý tìm kiếm
});
