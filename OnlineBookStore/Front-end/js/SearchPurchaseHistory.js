const API_BASE_URL = "http://localhost:5000/api"; // Cập nhật URL API đúng với backend của bạn

document.addEventListener("DOMContentLoaded", async function () {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.userId) {
    Swal.fire({
      icon: "warning",
      title: "Bạn chưa đăng nhập!",
      text: "Chuyển hướng về trang đăng nhập.",
    }).then(() => {
      window.location.href = "./Login.html";
    });
    return;
  }

  await fetchOrderHistory(user.userId);
});

async function fetchOrderHistory(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/history/${userId}`);

    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const data = await response.json();
    renderOrderTable(data.$values || data);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đơn hàng:", error);
  }
}

function renderOrderTable(orders) {
  const tableBody = document.getElementById("order-table-body");
  tableBody.innerHTML = "";

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">Không có đơn hàng nào</td></tr>`;
    return;
  }

  const rows = orders
    .map(
      (order, index) => `
      <tr>
          <td>${index + 1}</td>
          <td>#${order.orderId}</td>
          <td>${new Date(order.orderDate).toLocaleDateString()}</td>
          <td>${order.totalPrice.toLocaleString()}đ</td>
          <td>${getOrderStatus(order.status)}</td>
          <td><a href="OrderDetail.html?orderId=${
            order.orderId
          }">Xem chi tiết</a></td>
      </tr>
    `
    )
    .join("");

  tableBody.insertAdjacentHTML("beforeend", rows);
}

function getOrderStatus(status) {
  const statusMap = {
    Pending: "Chờ xác nhận",
    Shipped: "Đang giao",
    Delivered: "Hoàn thành",
    Canceled: "Đã hủy",
  };
  return statusMap[status] || "Không xác định";
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
