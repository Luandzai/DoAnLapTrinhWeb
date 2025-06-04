const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
  // Thêm kiểm tra quyền admin
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "Admin") {
    Swal.fire({
      icon: "warning",
      title: "Truy cập bị từ chối",
      text: "Bạn không có quyền truy cập trang này! Chuyển hướng về trang chủ.",
    }).then(() => {
      window.location.href = "../html/index.html";
    });
    return;
  }

  const revenueTableBody = document.querySelector("#revenue-table tbody");
  const totalRevenueElement = document.querySelector(".total-revenue");
  const filterForm = document.getElementById("filter-form");

  // Hàm render bảng doanh thu
  function renderRevenueTable(orders) {
    console.log("Dữ liệu đơn hàng từ API:", orders);
    if (!Array.isArray(orders) || orders.length === 0) {
      revenueTableBody.innerHTML = `<tr><td colspan="4">Không có dữ liệu</td></tr>`;
      return;
    }
    revenueTableBody.innerHTML = "";
    orders.forEach((order) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.orderId}</td>
        <td>${order.customerName}</td>
        <td>${Number(order.totalPrice).toLocaleString()} VNĐ</td>
        <td>${formatDate(order.orderDate)}</td>
      `;
      revenueTableBody.appendChild(row);
    });
  }

  // Hàm định dạng ngày
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN");
  }

  // Hàm lấy dữ liệu doanh thu từ API
  async function fetchRevenueData(startDate, endDate) {
    try {
      const url = new URL(`${API_BASE_URL}/Revenue/filter`);
      if (startDate) url.searchParams.append("startDate", startDate);
      if (endDate) url.searchParams.append("endDate", endDate);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();

      // Lấy đúng mảng đơn hàng từ result.orders.$values hoặc result.orders
      let ordersArr = [];
      if (result.success && result.orders) {
        if (Array.isArray(result.orders)) {
          ordersArr = result.orders;
        } else if (
          result.orders.$values &&
          Array.isArray(result.orders.$values)
        ) {
          ordersArr = result.orders.$values;
        }
        renderRevenueTable(ordersArr);
        totalRevenueElement.textContent = `Tổng doanh thu: ${Number(
          result.totalRevenue
        ).toLocaleString()} VNĐ`;
      } else {
        renderRevenueTable([]);
        totalRevenueElement.textContent = `Tổng doanh thu: 0 VNĐ`;
        Swal.fire({
          icon: "info",
          title: "Thông báo",
          text: result.message || "Không có dữ liệu doanh thu.",
        });
      }
    } catch (error) {
      renderRevenueTable([]);
      totalRevenueElement.textContent = `Tổng doanh thu: 0 VNĐ`;
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: `Đã xảy ra lỗi khi lấy dữ liệu doanh thu: ${error.message}`,
      });
    }
  }

  // Xử lý sự kiện lọc
  filterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (!startDate || !endDate) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.",
      });
      return;
    }
    await fetchRevenueData(startDate, endDate);
  });

  // Đặt mặc định ngày bắt đầu và kết thúc là rỗng, tổng doanh thu là 0
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  renderRevenueTable([]);
  totalRevenueElement.textContent = "Tổng doanh thu: 0 VNĐ";
});
// Không cần sửa gì thêm, code đã đúng.

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

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  await fetchCategories();
  handleSearch();
  renderLoginSection(); // Thêm chức năng render login
});
