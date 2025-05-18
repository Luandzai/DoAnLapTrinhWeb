// Hàm render mã giảm giá
function renderDiscountCodes(discounts) {
  const discountList = document.getElementById("discount-code-list");
  discountList.innerHTML = ""; // Xóa nội dung trước đó

  if (!discounts || !discounts.$values || !Array.isArray(discounts.$values)) {
    console.error("Discounts data is not in the expected format:", discounts);
    discountList.innerHTML =
      "<p>Không thể tải mã giảm giá. Vui lòng thử lại sau.</p>";
    return;
  }

  const discountArray = discounts.$values;

  if (discountArray.length === 0) {
    discountList.innerHTML = "<p>Không có mã giảm giá nào hiện tại.</p>";
    return;
  }

  discountArray.forEach((discount) => {
    const discountItem = document.createElement("div");
    discountItem.classList.add("discount-code__item");

    discountItem.innerHTML = `
        <span class="discount-code__code">${discount.code}</span>
        <span class="discount-code__amount">Giảm ${discount.discountAmount.toLocaleString()}đ</span>
        <span class="discount-code__date">Hết hạn: ${new Date(
          discount.endDate
        ).toLocaleDateString()}</span>
        <button class="discount-code__save-btn" data-discount-id="${
          discount.discountId
        }">Lưu mã</button>
      `;

    discountList.appendChild(discountItem);

    const saveButton = discountItem.querySelector(".discount-code__save-btn");
    saveButton.addEventListener("click", async () => {
      await saveDiscount(discount.discountId);
    });
  });
}

// Biến toàn cục cho sách flash sale
let allDiscountBooks = [];
let filteredDiscountBooks = [];
let currentPage = 1;
const booksPerPage = 16;
let currentSort = "newest"; // Mặc định sắp xếp theo mới nhất

// Hàm render danh sách sách giảm giá với phân trang
function renderDiscountBooks(books) {
  const bookList = document.getElementById("discount-book-list");
  bookList.innerHTML = ""; // Xóa nội dung trước đó

  if (!books || !books.$values || !Array.isArray(books.$values)) {
    console.error("Books data is not in the expected format:", books);
    bookList.innerHTML =
      "<p>Không thể tải sách giảm giá. Vui lòng thử lại sau.</p>";
    return;
  }

  allDiscountBooks = books.$values;
  applyFiltersAndSort(); // Áp dụng sắp xếp
}

// Hàm áp dụng sắp xếp
function applyFiltersAndSort() {
  filteredDiscountBooks = [...allDiscountBooks];

  // Sắp xếp sách
  filteredDiscountBooks.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.updatedAt || "1970-01-01T00:00:00");
    const dateB = new Date(b.createdAt || b.updatedAt || "1970-01-01T00:00:00");

    // Kiểm tra nếu ngày không hợp lệ
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      console.error("Invalid date format:", {
        dateA: a.createdAt,
        dateB: b.createdAt,
      });
      return 0; // Không sắp xếp nếu ngày không hợp lệ
    }

    return currentSort === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Reset về trang 1 khi sắp xếp
  currentPage = 1;

  // Render sách và pagination
  renderDiscountBooksPage();
  renderDiscountBooksPagination();
}
// Hàm render sách của trang hiện tại
function renderDiscountBooksPage() {
  const bookList = document.getElementById("discount-book-list");
  const start = (currentPage - 1) * booksPerPage;
  const end = start + booksPerPage;
  const booksToShow = filteredDiscountBooks.slice(start, end);

  bookList.innerHTML = booksToShow.length
    ? booksToShow
        .map(
          (book) => `
              <div class="book-item">
                <a href="../html/book-detail.html?id=${book.bookId}">
                  <img src="${book.coverImage}" alt="${book.title}" />
                  <span class="book-name">${book.title}</span>
                  <div class="Gia">
                    <span class="GiaHienTai">${book.discountPrice.toLocaleString()}đ</span>
                    <span class="discount">-${Math.round(
                      ((book.oldPrice - book.discountPrice) / book.oldPrice) *
                        100
                    )}%</span>
                  </div>
                  <span class="GiaCu">${book.oldPrice.toLocaleString()}đ</span>
                  <span class="DaBan">Đã bán: ${book.soldQuantity || 0}</span>
                </a>
              </div>
            `
        )
        .join("")
    : "<p>Không có sách giảm giá nào hiện tại.</p>";
}

// Hàm tạo pagination cho sách flash sale
function renderDiscountBooksPagination() {
  const pagination = document.getElementById("discount-book-pagination");
  if (!pagination) {
    console.error("Không tìm thấy phần tử discount-book-pagination");
    return;
  }

  const totalPages = Math.ceil(filteredDiscountBooks.length / booksPerPage);
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
      renderDiscountBooksPage();
      renderDiscountBooksPagination();
    });
  });
}

// Hàm kiểm tra trạng thái đăng nhập
function isLoggedIn() {
  const user = localStorage.getItem("user");
  return user !== null;
}

// Hàm lấy userId từ localStorage
function getUserId() {
  const user = localStorage.getItem("user");
  if (user) {
    const userData = JSON.parse(user);
    return userData.userId;
  }
  return null;
}

// Hàm lưu mã giảm giá
async function saveDiscount(discountId) {
  try {
    // Kiểm tra trạng thái đăng nhập
    if (!isLoggedIn()) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng đăng nhập để lưu mã giảm giá!",
      });
      window.location.href = "login.html"; // Chuyển hướng đến trang đăng nhập
      return;
    }

    // Lấy userId từ localStorage
    const userId = getUserId();
    if (!userId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.",
      });
      localStorage.removeItem("user");
      window.location.href = "login.html";
      return;
    }

    const response = await fetch("http://localhost:5000/api/Discounts/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        discountId: discountId,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: result.message,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message,
      });
    }
  } catch (error) {
    console.error("Error saving discount:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Xử lý ô tìm kiếm
function handleSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) {
    console.error("Không tìm thấy ô tìm kiếm với id 'search-input'");
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không tìm thấy ô tìm kiếm. Vui lòng kiểm tra lại.",
    });
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

// Hàm gọi API để lấy dữ liệu
async function fetchData() {
  try {
    const discountResponse = await fetch("http://localhost:5000/api/Discounts");
    if (!discountResponse.ok) {
      throw new Error(`HTTP error! Status: ${discountResponse.status}`);
    }
    const discounts = await discountResponse.json();
    console.log("Discounts API response:", discounts);
    renderDiscountCodes(discounts);

    const booksResponse = await fetch(
      "http://localhost:5000/api/Books/discount"
    );
    if (!booksResponse.ok) {
      throw new Error(`HTTP error! Status: ${booksResponse.status}`);
    }
    const books = await booksResponse.json();
    console.log("Books API response:", books);
    renderDiscountBooks(books);

    // Lấy danh mục cho header
    await fetchCategories();
  } catch (error) {
    console.error("Error fetching data:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
    });
  }
}

// Hàm lấy danh mục từ API
async function fetchCategories() {
  try {
    const response = await fetch("http://localhost:5000/api/categories");
    if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

    const data = await response.json();
    console.log("📌 Categories từ API:", data); // Kiểm tra dữ liệu

    const categories = data.$values || []; // Lấy danh mục chính
    renderCategories(categories, "category-list"); // Render vào header
  } catch (error) {
    console.error("❌ Lỗi tải danh mục:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không thể tải danh mục. Vui lòng thử lại sau.",
    });
  }
}

// Hàm render danh mục vào header
function renderCategories(categories, elementId) {
  const categoryContainer = document.getElementById(elementId);
  if (!categoryContainer) {
    console.error(`Không tìm thấy phần tử ${elementId} trong HTML`);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: `Không tìm thấy phần tử ${elementId}. Vui lòng kiểm tra lại.`,
    });
    return;
  }

  categoryContainer.innerHTML = categories
    .map((category) => {
      const subCategories = category.subCategories?.$values || []; // Lấy danh mục con

      return `
          <div class="nav__dropdown-item">
            <a href="../html/book-list.html?categoryId=${category.categoryId}">
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

// Thêm sự kiện sắp xếp
document
  .getElementById("sort-discount-books")
  ?.addEventListener("change", function () {
    currentSort = this.value;
    applyFiltersAndSort();
  });

// Hàm render phần login dựa trên trạng thái đăng nhập
function renderLoginSection() {
  const loginSection = document.getElementById("login-section");
  const user = JSON.parse(localStorage.getItem("user")); // Lấy thông tin user từ localStorage

  if (!loginSection) {
    console.error("Không tìm thấy login-section trong HTML");
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không tìm thấy phần tử đăng nhập. Vui lòng kiểm tra lại.",
    });
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

// Khởi chạy khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
  fetchData();
  handleSearch();
  renderLoginSection(); // Thêm chức năng render login
});
