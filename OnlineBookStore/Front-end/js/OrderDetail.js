const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");

  if (!orderId) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không tìm thấy đơn hàng.",
    });
    window.location.href = "./history.html";
    return;
  }

  await fetchOrderDetail(orderId);
});

async function fetchOrderDetail(orderId) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/detail/${orderId}`);
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const orderDetail = await response.json();
    renderOrderDetail(orderDetail);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.",
    });
  }
}

function renderOrderDetail(order) {
  document.getElementById("order-id").textContent = `#${order.orderId}`;
  document.getElementById("order-date").textContent = new Date(
    order.orderDate
  ).toLocaleDateString();
  document.getElementById("order-status").textContent = getOrderStatus(
    order.status
  );
  document.getElementById("payment-method").textContent = order.paymentMethod;
  document.getElementById("customer-name").textContent = order.customerName;
  document.getElementById("shipping-address").textContent =
    order.shippingAddress;
  document.getElementById(
    "shipping-fee"
  ).textContent = `${order.shippingFee.toLocaleString()}đ`;
  document.getElementById(
    "shipping-fee-summary"
  ).textContent = `${order.shippingFee.toLocaleString()}đ`;
  document.getElementById(
    "subtotal"
  ).textContent = `${order.subTotal.toLocaleString()}đ`;
  document.getElementById(
    "discount"
  ).textContent = `-${order.discount.toLocaleString()}đ`;
  document.getElementById(
    "total-price"
  ).textContent = `${order.totalPrice.toLocaleString()}đ`;

  const orderItems = order.items.$values
    .map(
      (item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.title}</td>
            <td>${item.quantity}</td>
            <td>${item.unitPrice.toLocaleString()}đ</td>
            <td>${(item.quantity * item.unitPrice).toLocaleString()}đ</td>
        </tr>
    `
    )
    .join("");
  document.getElementById("order-items").innerHTML = orderItems;

  // Thêm nút quay lại dựa trên role
  const user = JSON.parse(localStorage.getItem("user"));
  const backButton = document.createElement("div");
  backButton.classList.add("back-button-container");

  if (user && user.role === "Admin") {
    backButton.innerHTML = `<a href="../html/order-management.html" class="btn-back">Quay lại</a>`;
  } else {
    backButton.innerHTML = `<a href="../html/PurchaseHistory.html" class="btn-back">Quay lại</a>`;
  }

  // Chèn nút vào vị trí phù hợp trong trang
  const contentContainer = document.querySelector(".content-container"); // Hoặc selector phù hợp với HTML của bạn
  contentContainer.appendChild(backButton);
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
      } else {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo",
          text: "Vui lòng nhập từ khóa tìm kiếm.",
        });
      }
    }
  });
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
