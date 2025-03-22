// API base URL
const API_BASE_URL = "http://localhost:5000/api";

// Hàm lấy danh mục và render vào header
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
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
  const bookId = urlParams.get("id");

  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
    const book = await response.json();

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
      await fetchRelatedBooks(book.categoryID);
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

// Hàm lấy sách liên quan
async function fetchRelatedBooks(categoryId) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = parseInt(urlParams.get("id"));
    const response = await fetch(
      `${API_BASE_URL}/books?categoryId=${categoryId}`
    );
    const books = await response.json();
    const relatedBooks = books.filter((b) => b.bookID !== bookId).slice(0, 4); // Lấy tối đa 4 sách

    const relatedBooksContainer = document.getElementById("related-books");
    relatedBooksContainer.innerHTML = relatedBooks
      .map(
        (book) => `
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
        `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching related books:", error);
    document.getElementById("related-books").innerHTML =
      "<p>Lỗi tải sách liên quan.</p>";
  }
}

// Hàm lấy và render đánh giá
async function fetchReviews(bookId) {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}/reviews`);
    const reviews = await response.json();
    const reviewList = document.getElementById("review-list");
    reviewList.innerHTML =
      reviews
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
  } catch (error) {
    console.error("Error fetching reviews:", error);
    document.getElementById("review-list").innerHTML =
      "<p>Lỗi tải đánh giá.</p>";
  }
}

// Hàm xử lý gửi đánh giá
function handleReviewSubmit() {
  document
    .getElementById("submit-review")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = parseInt(urlParams.get("id"));
      const name = document.getElementById("review-name").value.trim();
      const rating = document.querySelector(
        'input[name="rating"]:checked'
      )?.value;
      const comment = document.getElementById("review-text").value.trim();

      if (name && rating && comment) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/books/${bookId}/reviews`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, rating: parseInt(rating), comment }),
            }
          );

          if (response.ok) {
            fetchReviews(bookId); // Cập nhật danh sách đánh giá
            // Reset form
            document.getElementById("review-name").value = "";
            document.querySelector(
              'input[name="rating"]:checked'
            ).checked = false;
            document.getElementById("review-text").value = "";
          } else {
            alert("Lỗi khi gửi đánh giá!");
          }
        } catch (error) {
          console.error("Error submitting review:", error);
          alert("Lỗi khi gửi đánh giá!");
        }
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

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = parseInt(urlParams.get("id"));

  fetchCategories();
  fetchBookDetail();
  fetchReviews(bookId);
  handleReviewSubmit();
});
