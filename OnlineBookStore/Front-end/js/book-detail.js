// API endpoints
const API_BASE_URL = "http://localhost:5000/api";

// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Hàm tính phần trăm giảm giá
function calculateDiscount(originalPrice, discountPrice) {
  if (!originalPrice || !discountPrice) return 0;
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

// Hàm lấy bookId từ URL
function getBookIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Hàm lấy chi tiết sách từ API
async function fetchBookDetail(bookId) {
  try {
    const response = await fetch(`${API_BASE_URL}/Books/${bookId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const book = await response.json();
    console.log("Book detail from API:", book);
    return book;
  } catch (error) {
    console.error("❌ Lỗi tải chi tiết sách:", error);
    return null;
  }
}

// Hàm render chi tiết sách
function renderBookDetail(book) {
  if (!book) {
    const bookDetailContent = document.getElementById("book-detail-content");
    if (bookDetailContent) {
      bookDetailContent.innerHTML = "<p>Không tìm thấy sách!</p>";
    } else {
      console.error("Không tìm thấy book-detail-content trong HTML");
    }
    return;
  }

  const bookCover = document.getElementById("book-cover");
  const bookTitle = document.getElementById("book-title");
  const bookAuthor = document.getElementById("book-author");
  const bookPrice = document.getElementById("book-price");
  const bookOldPrice = document.getElementById("book-old-price");
  const bookDiscount = document.getElementById("book-discount");
  const bookStock = document.getElementById("book-stock");
  const bookDescShort = document.getElementById("book-desc-short");
  const bookDescFull = document.getElementById("book-desc-full");

  if (bookCover) bookCover.src = book.coverImage || "placeholder.jpg";
  if (bookCover) bookCover.alt = book.title;
  if (bookTitle) bookTitle.textContent = book.title;
  if (bookAuthor)
    bookAuthor.textContent = `Tác giả: ${
      book.authorName || "Không có thông tin"
    }`;
  if (bookPrice)
    bookPrice.textContent = `Giá: ${formatPrice(
      book.discountPrice || book.price
    )}`;
  if (bookOldPrice)
    bookOldPrice.textContent = book.oldPrice
      ? `Giá gốc: ${formatPrice(book.oldPrice)}`
      : "";
  if (bookDiscount)
    bookDiscount.textContent = book.discountPrice
      ? `Giảm giá: ${calculateDiscount(
          book.oldPrice || book.price,
          book.discountPrice
        )}%`
      : "";
  if (bookStock) bookStock.textContent = `Tồn kho: ${book.stockQuantity || 0}`;

  const description = book.description || "Không có mô tả";
  if (bookDescShort)
    bookDescShort.textContent =
      description.length > 100
        ? description.substring(0, 100) + "..."
        : description;
  if (bookDescFull) bookDescFull.textContent = description;
}

// Hàm lấy sách liên quan
async function fetchRelatedBooks(categoryId, currentBookId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Books?categoryId=${categoryId}`
    );
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log("Related books from API:", data);

    // Xử lý trường hợp API trả về dữ liệu bọc trong $values
    const books = data.$values || data;
    if (!Array.isArray(books)) {
      console.error("Dữ liệu sách liên quan không phải là mảng:", books);
      return [];
    }

    console.log("Current book ID:", currentBookId);
    console.log("Books before filter:", books);

    // Loại bỏ sách hiện tại
    const filteredBooks = books.filter(
      (book) => book.bookId !== parseInt(currentBookId)
    );
    console.log("Books after filter:", filteredBooks);

    return filteredBooks;
  } catch (error) {
    console.error("❌ Lỗi tải sách liên quan:", error);
    return [];
  }
}

// Hàm render sách liên quan
function renderRelatedBooks(books) {
  const relatedBooksList = document.getElementById("related-books");
  if (!relatedBooksList) {
    console.error("Không tìm thấy related-books trong HTML");
    return;
  }

  if (!books || books.length === 0) {
    relatedBooksList.innerHTML = "<p>Không có sách liên quan.</p>";
    return;
  }

  relatedBooksList.innerHTML = books
    .map(
      (book) => `
      <div class="book-item">
        <a href="../html/book-detail.html?id=${book.bookId}">
          <img src="${book.coverImage || "placeholder.jpg"}" alt="${
        book.title
      }">
        </a>
        <h3 class="book-name">${book.title}</h3>
        <div class="Gia">
          <span class="GiaHienTai">${formatPrice(
            book.discountPrice || book.price
          )}</span>
          ${
            book.discountPrice
              ? `<span class="discount">-${calculateDiscount(
                  book.oldPrice || book.price,
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
}

// Hàm render đánh giá
function renderReviews(reviews) {
  const reviewList = document.getElementById("review-list");
  if (!reviewList) {
    console.error("Không tìm thấy review-list trong HTML");
    return;
  }

  console.log("Reviews from API:", reviews);

  // Xử lý $values từ API
  const reviewArray =
    reviews && reviews.$values ? reviews.$values : reviews || [];
  if (!Array.isArray(reviewArray)) {
    console.error("Dữ liệu reviews không phải là mảng:", reviewArray);
    reviewList.innerHTML = "<p>Lỗi: Dữ liệu đánh giá không hợp lệ.</p>";
    return;
  }

  if (reviewArray.length === 0) {
    console.log("Không có đánh giá nào để hiển thị.");
    reviewList.innerHTML = "<p>Chưa có đánh giá nào.</p>";
    return;
  }

  console.log("Rendering reviews:", reviewArray);
  reviewList.innerHTML = reviewArray
    .map((review) => {
      if (!review.userName || !review.rating || !review.createdAt) {
        console.error("Dữ liệu review không đầy đủ:", review);
        return "";
      }
      return `
        <div class="review-item">
          <p><strong>${review.userName}</strong> (${new Date(
        review.createdAt
      ).toLocaleDateString()})</p>
          <p>Đánh giá: ${"★".repeat(review.rating)}${"☆".repeat(
        5 - review.rating
      )}</p>
          <p>${review.comment || "Không có bình luận"}</p>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");
}

// Hàm xử lý gửi đánh giá
async function submitReview(bookId) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Vui lòng đăng nhập để gửi đánh giá!",
    }).then(() => {
      window.location.href = "../html/Login.html";
    });
    return;
  }

  const nameInput = document.getElementById("review-name");
  const ratingInputs = document.getElementsByName("rating");
  const commentInput = document.getElementById("review-text");

  if (!ratingInputs || !commentInput) {
    console.error("Không tìm thấy các phần tử form trong HTML");
    alert("Lỗi: Không tìm thấy form đánh giá!");
    return;
  }

  const rating = Array.from(ratingInputs).find((input) => input.checked)?.value;
  const comment = commentInput.value.trim();

  if (!rating || !comment) {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Vui lòng chọn số sao và nhập nội dung đánh giá!",
    });
    return;
  }

  const reviewData = {
    userId: user.userId,
    bookId: parseInt(bookId),
    rating: parseInt(rating),
    comment: comment,
  };
  console.log("Review data to send:", reviewData);

  try {
    const response = await fetch(`${API_BASE_URL}/Reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      result = {
        message: (await response.text()) || "Lỗi không xác định từ server.",
      };
    }

    console.log("Response from review API:", result);

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: result.message || "Gửi đánh giá thành công!",
      });
      ratingInputs.forEach((input) => (input.checked = false));
      commentInput.value = "";
      window.location.reload();
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          result.message ||
          `Gửi đánh giá thất bại! (Status: ${response.status})`,
      });
    }
  } catch (error) {
    console.error("❌ Lỗi gửi đánh giá:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã có lỗi xảy ra khi gửi đánh giá: " + error.message,
    });
  }
}

// Hàm render phần login dựa trên trạng thái đăng nhập
function renderLoginSection() {
  const loginSection = document.getElementById("login-section");
  const user = JSON.parse(localStorage.getItem("user")); // Lấy thông tin user từ localStorage

  if (!loginSection) {
    console.error("Không tìm thấy login-section trong HTML");
    return;
  }

  if (!user) {
    // Chưa đăng nhập
    loginSection.innerHTML = `
      <button class="login__dropdown-btn">
        <img src="../img/Login.svg" alt="Đăng nhập" />
      </button>
      <div class="login__dropdown-content">
        <a href="./Login.html">Đăng Nhập</a>
      </div>
    `;
  } else {
    // Đã đăng nhập
    const menuItems =
      user.role === "Admin"
        ? `
          <a href="../html/admin.html">Quản lý</a>
          <a href="#" id="logout-btn">Đăng xuất</a>
        `
        : `
          <a href="../html/user.html">Thông tin cá nhân</a>
          <a href="#" id="logout-btn">Đăng xuất</a>
        `;

    loginSection.innerHTML = `
      <div class="login__user">
        <img src="../img/login.svg" alt="Avatar" />
        <span>${user.fullName}</span>
      </div>
      <div class="login__dropdown-content">
        ${menuItems}
      </div>
    `;

    // Xử lý đăng xuất
    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user"); // Xóa thông tin user
      window.location.reload(); // Tải lại trang
    });
  }
}

// Xử lý ô tìm kiếm
function handleSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) {
    console.error("Không tìm thấy ô tìm kiếm");
    return;
  }

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

// Hàm lấy danh mục và render
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/Categories`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log("Categories from API:", data);

    const categories = data.$values || data;
    if (!Array.isArray(categories)) {
      console.error("Dữ liệu categories không phải là mảng:", categories);
      document.getElementById("category-list").innerHTML =
        '<div class="nav__dropdown-item">Lỗi dữ liệu danh mục</div>';
      return;
    }

    const categoryList = document.getElementById("category-list");
    if (!categoryList) {
      console.error("Không tìm thấy category-list trong HTML");
      return;
    }

    if (categories.length === 0) {
      console.warn("Không có danh mục nào để hiển thị");
      categoryList.innerHTML =
        '<div class="nav__dropdown-item">Không có danh mục</div>';
      return;
    }

    categoryList.innerHTML = categories
      .map((category) => {
        const subCategories =
          category.subCategories?.$values || category.subCategories || [];

        if (!category.categoryId || !category.categoryName) {
          console.warn("Dữ liệu category không hợp lệ:", category);
          return "";
        }

        return `
          <div class="nav__dropdown-item">
            <a href="../html/book-list.html?categoryId=${category.categoryId}">
              ${category.categoryName}
            </a>
            ${
              subCategories.length > 0
                ? `<div class="nav__dropdown-subcontent">
                    ${subCategories
                      .map((sub) => {
                        if (!sub.categoryId || !sub.categoryName) {
                          console.warn(
                            "Dữ liệu subcategory không hợp lệ:",
                            sub
                          );
                          return "";
                        }
                        return `
                          <div class="nav__dropdown-subitem">
                            <a href="../html/book-list.html?categoryId=${sub.categoryId}">
                              ${sub.categoryName}
                            </a>
                          </div>
                        `;
                      })
                      .filter(Boolean)
                      .join("")}
                  </div>`
                : ""
            }
          </div>
        `;
      })
      .filter(Boolean)
      .join("");
  } catch (error) {
    console.error("❌ Lỗi tải danh mục:", error);
    const categoryList = document.getElementById("category-list");
    if (categoryList) {
      categoryList.innerHTML =
        '<div class="nav__dropdown-item">Lỗi tải danh mục</div>';
    }
  }
}

// Hàm xử lý thêm vào giỏ hàng
async function addToCart(bookId) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Vui lòng đăng nhập để thêm sách vào giỏ hàng!",
    }).then(() => {
      window.location.href = "../html/Login.html";
    });
    return;
  }

  const cartData = {
    userId: user.userId,
    bookId: parseInt(bookId),
    quantity: 1, // Mặc định thêm 1 cuốn
  };
  console.log("Cart data to send:", cartData);

  try {
    const response = await fetch(`${API_BASE_URL}/Carts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cartData),
    });

    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      result = {
        message: (await response.text()) || "Lỗi không xác định từ server.",
      };
    }

    console.log("Response from cart API:", result);

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: result.message || "Đã thêm sách vào giỏ hàng thành công!",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          result.message ||
          `Thêm vào giỏ hàng thất bại! (Status: ${response.status})`,
      });
    }
  } catch (error) {
    console.error("❌ Lỗi thêm vào giỏ hàng:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã có lỗi xảy ra khi thêm vào giỏ hàng: " + error.message,
    });
  }
}

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  const bookId = getBookIdFromUrl();
  if (!bookId) {
    const bookDetailContent = document.getElementById("book-detail-content");
    if (bookDetailContent) {
      bookDetailContent.innerHTML = "<p>Không tìm thấy ID sách!</p>";
    } else {
      console.error("Không tìm thấy book-detail-content trong HTML");
    }
    return;
  }

  const book = await fetchBookDetail(bookId);
  if (book) {
    renderBookDetail(book);
    renderReviews(book.reviews);

    // Lấy và render sách liên quan
    const relatedBooks = await fetchRelatedBooks(book.categoryId, bookId);
    renderRelatedBooks(relatedBooks);

    const submitButton = document.getElementById("submit-review");
    if (submitButton) {
      submitButton.addEventListener("click", () => {
        submitReview(bookId);
      });
    } else {
      console.error("Không tìm thấy submit-review button trong HTML");
    }
    // Xử lý thêm vào giỏ hàng
    const addToCartButton = document.querySelector(".book-detail__add-to-cart");
    if (addToCartButton) {
      addToCartButton.addEventListener("click", () => {
        addToCart(bookId);
      });
    } else {
      console.error("Không tìm thấy nút thêm vào giỏ hàng trong HTML");
    }
  }
  renderLoginSection(); // Thêm chức năng render login
  handleSearch();
  await fetchCategories();
});
