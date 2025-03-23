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
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

// Hàm lấy danh mục từ API và render vào header + sidebar
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const categories = await response.json();

    // Render danh mục trong header
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

    // Render checkbox danh mục trong sidebar
    const categoryCheckboxList = document.getElementById(
      "category-checkbox-list"
    );
    categoryCheckboxList.innerHTML = categories
      .map(
        (category) => `
          <li>
            <label>
              <input type="checkbox" name="category" value="${category.categoryID}" />
              ${category.categoryName}
            </label>
          </li>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching categories:", error);
    document.getElementById("category-list").innerHTML =
      '<div class="nav__dropdown-item">Lỗi tải danh mục</div>';
    document.getElementById("category-checkbox-list").innerHTML =
      "<li>Lỗi tải danh mục</li>";
  }
}

// Hàm lấy và hiển thị sách từ API
async function fetchBooks(page = 1, sort = "newest") {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryIdFromUrl = parseInt(urlParams.get("categoryId")); // Chuyển sang số
  const searchKeyword = urlParams.get("search") || ""; // Lấy từ khóa tìm kiếm từ URL
  const bookList = document.getElementById("book-list");
  const pagination = document.getElementById("pagination");
  const title = document.getElementById("book-list-title");

  // Lấy danh mục đã chọn từ checkbox
  const checkedCategories = Array.from(
    document.querySelectorAll('.sidebar__filter input[name="category"]:checked')
  ).map((checkbox) => parseInt(checkbox.value)); // Chuyển sang số

  try {
    // Tạo query string cho API
    let query = `?page=${page}&sort=${sort}`;
    if (searchKeyword) {
      query += `&search=${encodeURIComponent(searchKeyword)}`;
    } else if (checkedCategories.length > 0) {
      query += `&categories=${checkedCategories.join(",")}`;
    } else if (categoryIdFromUrl) {
      query += `&categoryId=${categoryIdFromUrl}`;
    }

    const response = await fetch(`${API_BASE_URL}/books${query}`);
    const data = await response.json();
    const books = data.books; // Giả định API trả về { books: [], totalPages: X }
    const totalPages = data.totalPages;

    // Cập nhật tiêu đề
    if (searchKeyword) {
      title.textContent = `Kết quả tìm kiếm: "${searchKeyword}" (${books.length} sách)`;
    } else if (checkedCategories.length > 0) {
      title.textContent = "Sách theo danh mục đã chọn";
    } else if (categoryIdFromUrl) {
      const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
      const categories = await categoriesResponse.json();
      const selectedCategory = categories.find(
        (cat) => cat.categoryID === categoryIdFromUrl
      );
      title.textContent = selectedCategory
        ? `Sách thuộc danh mục: ${selectedCategory.categoryName}`
        : "Danh sách Sách";
    } else {
      title.textContent = "Danh sách Sách";
    }

    // Render sách
    bookList.innerHTML =
      books
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
        .join("") || "<p>Không tìm thấy sách nào</p>";

    // Render phân trang
    pagination.innerHTML = `
      <a href="#" data-page="${page > 1 ? page - 1 : 1}">«</a>
      ${Array.from({ length: totalPages }, (_, i) => i + 1)
        .map(
          (p) => `
            <a href="#" data-page="${p}" class="${
            p === page ? "active" : ""
          }">${p}</a>
          `
        )
        .join("")}
      <a href="#" data-page="${page < totalPages ? page + 1 : totalPages}">»</a>
    `;

    // Thêm sự kiện cho phân trang
    document.querySelectorAll(".pagination a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.getAttribute("data-page"));
        fetchBooks(newPage, sort);
      });
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    bookList.innerHTML = "<p>Lỗi tải danh sách sách</p>";
  }
}

// Xử lý sắp xếp
function handleSort() {
  document.querySelectorAll(".book-list__sort-content a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const sort = e.target.getAttribute("data-sort");
      fetchBooks(1, sort);
    });
  });
}

// Xử lý lọc bằng checkbox
document.getElementById("category-filter").addEventListener("submit", (e) => {
  e.preventDefault();
  fetchBooks(1, "newest"); // Gọi lại với page 1 khi lọc
});

// Xử lý ô tìm kiếm trong header
function handleSearch() {
  const searchInput = document.querySelector(".header__search");
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const keyword = searchInput.value.trim();
      if (keyword) {
        // Cập nhật URL với từ khóa tìm kiếm
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
  fetchBooks(1, "newest"); // Trang 1, sắp xếp mới nhất mặc định
  handleSort();
  handleSearch();
});
