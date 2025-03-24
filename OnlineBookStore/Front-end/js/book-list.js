document.addEventListener("DOMContentLoaded", async function () {
  const params = new URLSearchParams(window.location.search);
  const keyword = params.get("search") || "";
  const categoryId = params.get("categoryId") || "";

  await fetchBooks(keyword, categoryId);
  await fetchCategories();
});

// Biến toàn cục lưu sách để tìm kiếm
let allBooks = [];
let filteredBooks = [];
let currentPage = 1;
const booksPerPage = 16;

// 🟢 Fetch sách từ API (hỗ trợ tìm kiếm & lọc danh mục)
async function fetchBooks(keyword = "", categoryId = "") {
  try {
    let url = `http://localhost:5000/api/books`;
    const queryParams = [];

    if (keyword) queryParams.push(`search=${encodeURIComponent(keyword)}`);
    if (categoryId) queryParams.push(`categoryId=${categoryId}`);

    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

    const data = await response.json();
    allBooks = data.$values || [];
    filteredBooks = [...allBooks];

    renderPagination();
    renderBooks();
  } catch (error) {
    console.error("❌ Lỗi tải sách:", error);
  }
}

// 🟢 Hàm xử lý khi chọn danh mục trong header
document
  .getElementById("category-list")
  ?.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      e.preventDefault();
      const categoryId = new URL(e.target.href).searchParams.get("categoryId");
      if (categoryId) {
        window.location.href = `../html/book-list.html?categoryId=${categoryId}`;
      }
    }
  });

// 🟢 Hàm xử lý tìm kiếm theo danh mục trong sidebar
document
  .getElementById("category-filter")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const selectedCategories = [
      ...document.querySelectorAll('input[name="category"]:checked'),
    ]
      .map((input) => input.value)
      .join(",");

    if (selectedCategories) {
      window.location.href = `../html/book-list.html?categoryId=${selectedCategories}`;
    }
  });

// Hàm hiển thị sách theo trang
function renderBooks() {
  const bookList = document.getElementById("book-list");
  if (!bookList) {
    console.error("Không tìm thấy phần tử book-list");
    return;
  }

  // Xác định sách của trang hiện tại
  const start = (currentPage - 1) * booksPerPage;
  const end = start + booksPerPage;
  const booksToShow = filteredBooks.slice(start, end);

  bookList.innerHTML = booksToShow.length
    ? booksToShow
        .map(
          (book) => `
              <div class="book-item">
                  <a href="../html/book-detail.html?id=${book.bookId}">
                      <img src="${book.coverImage || "placeholder.jpg"}" alt="${
            book.title
          }" loading="lazy">
                  </a>
                  <h3 class="book-name">${book.title}</h3>
                  <div class="Gia">
                      <span class="GiaHienTai">${formatPrice(
                        book.discountPrice || book.price
                      )}</span>
                      ${
                        book.discountPrice
                          ? `<span class="GiaCu">${formatPrice(
                              book.oldPrice
                            )}</span>`
                          : ""
                      }
                  </div>
                  <div class="DaBan">Đã bán ${book.soldQuantity || 0}</div>
              </div>
          `
        )
        .join("")
    : "<p>Không tìm thấy kết quả nào.</p>";
}

// Hàm tạo pagination
function renderPagination() {
  const pagination = document.getElementById("pagination");
  if (!pagination) {
    console.error("Không tìm thấy phần tử pagination");
    return;
  }

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  pagination.innerHTML = "";

  if (totalPages <= 1) return; // Ẩn pagination nếu chỉ có 1 trang

  // Nút Previous
  if (currentPage > 1) {
    pagination.innerHTML += `<button class="page-btn prev" data-page="${
      currentPage - 1
    }">«</button>`;
  }

  // Các nút trang
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `<button class="page-btn ${
      i === currentPage ? "active" : ""
    }" data-page="${i}">${i}</button>`;
  }

  // Nút Next
  if (currentPage < totalPages) {
    pagination.innerHTML += `<button class="page-btn next" data-page="${
      currentPage + 1
    }">»</button>`;
  }

  // Gắn sự kiện cho các nút
  document.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      currentPage = parseInt(this.dataset.page);
      renderBooks();
      renderPagination();
    });
  });
}

let timeout;
document
  .getElementById("search-books")
  ?.addEventListener("input", async function () {
    clearTimeout(timeout);
    const searchTerm = this.value.trim();
    timeout = setTimeout(async () => {
      await fetchBooks(searchTerm);
    }, 300); // Chờ 300ms trước khi gọi API
  });

// Event listener for search input (Enter key)
document
  .getElementById("search-books")
  ?.addEventListener("keydown", async function (event) {
    if (event.key === "Enter") {
      const searchTerm = this.value.trim();
      await fetchBooks(searchTerm);
    }
  });

// Hàm định dạng giá tiền
function formatPrice(price) {
  return price ? price.toLocaleString("vi-VN") + " VND" : "Liên hệ";
}

async function fetchCategories() {
  try {
    const response = await fetch("http://localhost:5000/api/categories");
    if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

    const data = await response.json();
    console.log("📌 Categories từ API:", data); // Kiểm tra dữ liệu

    const categories = data.$values || []; // Lấy danh mục chính
    renderCategories(categories, "category-list"); // Render vào header
    renderSidebarCategories(categories, "category-checkbox-list"); // Render vào sidebar
  } catch (error) {
    console.error("❌ Lỗi tải danh mục:", error);
  }
}

// Hàm render danh mục vào header
function renderCategories(categories, elementId) {
  const categoryContainer = document.getElementById(elementId);
  if (!categoryContainer) {
    console.error(`Không tìm thấy phần tử ${elementId} trong HTML`);
    return;
  }

  categoryContainer.innerHTML = categories
    .map((category) => {
      const subCategories = category.subCategories?.$values || []; // Lấy danh mục con

      return `
              <div class="nav__dropdown-item">
                <a href="../html/book-list.html?categoryId=${
                  category.categoryId
                }">
                  ${category.categoryName}
                </a>
                ${
                  subCategories.length > 0
                    ? `<div class="nav__dropdown-subcontent">
                        ${subCategories
                          .map(
                            (sub) => `
                              <div class="nav__dropdown-subitem">
                                <a href="../html/book-list.html?categoryId=${sub.categoryId}">
                                  ${sub.categoryName}
                                </a>
                              </div>
                          `
                          )
                          .join("")}
                      </div>`
                    : ""
                }
              </div>
            `;
    })
    .join("");
}

// Hàm render danh mục vào sidebar (checkbox)
function renderSidebarCategories(categories, elementId) {
  const categoryContainer = document.getElementById(elementId);
  if (!categoryContainer) {
    console.error(`Không tìm thấy phần tử ${elementId} trong HTML`);
    return;
  }

  categoryContainer.innerHTML = categories
    .map((category) => {
      const subCategories = category.subCategories?.$values || []; // Lấy danh mục con

      return `
              <li>
                  <label>
                      <input type="checkbox" name="category" value="${
                        category.categoryId
                      }">
                      ${category.categoryName}
                  </label>
                  ${
                    subCategories.length > 0
                      ? `<ul>
                          ${subCategories
                            .map(
                              (sub) => `
                              <li>
                                  <label>
                                      <input type="checkbox" name="category" value="${sub.categoryId}">
                                      ${sub.categoryName}
                                  </label>
                              </li>
                          `
                            )
                            .join("")}
                        </ul>`
                      : ""
                  }
              </li>
            `;
    })
    .join("");
}
