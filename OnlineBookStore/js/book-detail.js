// Hàm lấy danh mục và render vào header
async function fetchCategories() {
  try {
    const response = await fetch("../data/categories.json");
    const categories = await response.json();
    const categoryList = document.getElementById("category-list");
    categoryList.innerHTML = categories
      .map(
        (category) => `
              <div class="nav-dropdown-item">
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
      '<div class="nav-dropdown-item">Lỗi tải danh mục</div>';
  }
}

// Hàm lấy chi tiết sách và render
async function fetchBookDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = parseInt(urlParams.get("id"));

  try {
    const response = await fetch("../data/books.json");
    const books = await response.json();
    const book = books.find((b) => b.bookID === bookId);

    if (book) {
      // Render chi tiết sách
      document.getElementById("book-cover").src = book.coverImage;
      document.getElementById("book-title").textContent = book.title;
      document.getElementById("book-author").textContent = `Tác giả: ${
        book.author || "Không xác định"
      }`;
      document.getElementById("book-price").textContent = `Giá: ${formatPrice(
        book.discountPrice || book.price
      )}`;
      document.getElementById("book-discount").textContent = book.discountPrice
        ? `Giảm giá: ${calculateDiscount(book.price, book.discountPrice)}%`
        : "";
      document.getElementById("book-discount").style.display =
        book.discountPrice ? "block" : "none";
      document.getElementById("book-old-price").textContent = book.oldPrice
        ? `Giá cũ: ${formatPrice(book.oldPrice)}`
        : "";
      document.getElementById("book-stock").textContent = `Tồn kho: ${
        book.stockQuantity || 0
      } cuốn`;

      // Render mô tả
      const description = book.description || "Chưa có mô tả.";
      document.getElementById("book-desc-short").textContent =
        description.split(" ").slice(0, 50).join(" ") + "...";
      document.getElementById("book-desc-full").textContent = description;

      // Render sách liên quan
      const relatedBooks = books
        .filter(
          (b) => b.categoryID === book.categoryID && b.bookID !== book.bookID
        )
        .slice(0, 4);
      const relatedBooksContainer = document.getElementById("related-books");
      relatedBooksContainer.innerHTML = relatedBooks
        .map(
          (related) => `
                <div class="book-item">
                    <a href="../html/book-detail.html?id=${related.bookID}">
                        <img src="${related.coverImage}" alt="Book Cover" />
                    </a>
                    <h3 class="book-name">${related.title}</h3>
                    <div class="Gia">
                        <span class="GiaHienTai">${formatPrice(
                          related.discountPrice || related.price
                        )}</span>
                        ${
                          related.discountPrice
                            ? `<span class="discount">${calculateDiscount(
                                related.price,
                                related.discountPrice
                              )}%</span>`
                            : ""
                        }
                    </div>
                    ${
                      related.oldPrice
                        ? `<span class="GiaCu">${formatPrice(
                            related.oldPrice
                          )}</span>`
                        : ""
                    }
                    <div class="DaBan">Đã bán ${related.soldQuantity || 0}</div>
                </div>
            `
        )
        .join("");
    } else {
      document.querySelector(".book-detail").innerHTML =
        "<p>Sách không tồn tại.</p>";
    }
  } catch (error) {
    console.error("Error fetching book detail:", error);
    document.querySelector(".book-detail").innerHTML =
      "<p>Lỗi tải chi tiết sách.</p>";
  }
}

// Mock data cho đánh giá (sẽ lưu tạm trong localStorage)
let reviews = JSON.parse(localStorage.getItem("reviews")) || [
  { bookId: 1, name: "Nguyễn Văn A", rating: 3, comment: "Rất hay! Đáng mua!" },
  { bookId: 1, name: "Nguyễn Văn B", rating: 5, comment: "Rất hay! Đáng mua!" },
  { bookId: 1, name: "Trần Thị C", rating: 4, comment: "Sách rất hữu ích!" },
];

// Hàm render đánh giá
function renderReviews(bookId) {
  const reviewList = document.getElementById("review-list");
  const bookReviews = reviews.filter((r) => r.bookId === bookId);
  reviewList.innerHTML =
    bookReviews
      .map(
        (review) => `
            <div class="review">
                <p><strong>${review.name}</strong></p>
                <p>${"★".repeat(review.rating)}${"☆".repeat(
          5 - review.rating
        )}</p>
                <p>${review.comment}</p>
            </div>
        `
      )
      .join("") || "<p>Chưa có đánh giá nào.</p>";
}

// Hàm xử lý gửi đánh giá
function handleReviewSubmit() {
  document.getElementById("submit-review").addEventListener("click", (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = parseInt(urlParams.get("id"));
    const name = document.getElementById("review-name").value.trim();
    const rating = document.querySelector(
      'input[name="rating"]:checked'
    )?.value;
    const comment = document.getElementById("review-text").value.trim();

    if (name && rating && comment) {
      const newReview = { bookId, name, rating: parseInt(rating), comment };
      reviews.push(newReview);
      localStorage.setItem("reviews", JSON.stringify(reviews));
      renderReviews(bookId);

      // Reset form
      document.getElementById("review-name").value = "";
      document.querySelector('input[name="rating"]:checked').checked = false;
      document.getElementById("review-text").value = "";
    } else {
      alert("Vui lòng điền đầy đủ thông tin đánh giá!");
    }
  });
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
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = parseInt(urlParams.get("id"));

  fetchCategories();
  fetchBookDetail();
  renderReviews(bookId);
  handleReviewSubmit();
});
