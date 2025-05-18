const API_BASE_URL = "http://localhost:5000/api"; // Cập nhật nếu port khác

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "Admin") {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Bạn không có quyền truy cập trang này! Chuyển hướng về trang chủ.",
    }).then(() => {
      window.location.href = "../html/index.html";
    });
    return;
  }

  // Load các hàm chung
  await fetchCategories();
  handleSearch();
  renderLoginSection();

  // Load Dashboard mặc định
  loadDashboard();
});

// Hàm load Dashboard
async function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/dashboard?userId=${user.userId}`
    );

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: `Lỗi HTTP: ${response.status}`,
      });
      return;
    }

    const result = await response.json();
    if (result.success && result.data) {
      const stats = result.data;
      renderDashboard(stats);
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Không lấy được dữ liệu thống kê.",
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu Dashboard:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Hàm render Dashboard
function renderDashboard(stats) {
  const content = document.getElementById("admin-content");
  if (!content) {
    console.error("Không tìm thấy admin-content trong HTML");
    return;
  }

  content.innerHTML = `
        <h2>DASHBOARD</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>Doanh thu</h3>
                <p>${stats.totalRevenue.toLocaleString()}đ</p>
            </div>
            <div class="stat-card">
                <h3>Tổng đơn hàng</h3>
                <p>${stats.totalOrders}</p>
            </div>
            <div class="stat-card">
                <h3>Khách hàng</h3>
                <p>${stats.totalUsers}</p>
            </div>
            <div class="stat-card">
                <h3>Đơn chờ xử lý</h3>
                <p>${stats.pendingOrders}</p>
            </div>
        </div>
    `;
}

// Dùng lại các hàm từ userinfo.js
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
                        <a href="../html/book-list.html?categoryId=${
                          category.categoryId
                        }">
                            ${category.categoryName}
                        </a>
                        ${
                          subCategories.length > 0
                            ? `<div class="nav__dropdown-subcontent">
                                    ${subCategories
                                      .map((sub) => {
                                        if (
                                          !sub.categoryId ||
                                          !sub.categoryName
                                        ) {
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

function renderLoginSection() {
  const loginSection = document.getElementById("login-section");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!loginSection) {
    console.error("Không tìm thấy login-section trong HTML");
    return;
  }

  if (!user) {
    loginSection.innerHTML = `
            <button class="login__dropdown-btn">
                <img src="../img/Login.svg" alt="Đăng nhập" />
            </button>
            <div class="login__dropdown-content">
                <a href="./Login.html">Đăng Nhập</a>
            </div>
        `;
  } else {
    const menuItems =
      user.role === "Admin"
        ? `
                    <a href="../html/Admin.html">Quản lý</a>
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

    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.reload();
    });
  }
}
