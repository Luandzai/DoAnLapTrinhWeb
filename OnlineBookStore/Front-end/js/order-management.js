const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "Admin") {
    Swal.fire({
      icon: "error",
      title: "Truy cập bị từ chối",
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

  // Load danh sách đơn hàng
  await loadOrders();
});

// Hàm lấy danh sách đơn hàng
async function loadOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders`);
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const result = await response.json();
    console.log("Dữ liệu từ API:", result); // Kiểm tra dữ liệu

    if (result.success && result.data && Array.isArray(result.data.$values)) {
      renderOrders(result.data.$values); // Truyền mảng từ result.data.$values
    } else {
      console.error("Dữ liệu không hợp lệ hoặc không có đơn hàng:", result);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Không lấy được danh sách đơn hàng.",
      });
      renderOrders([]); // Render bảng rỗng nếu không có dữ liệu
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
    renderOrders([]); // Render bảng rỗng trong trường hợp lỗi
  }
}

// Hàm render danh sách đơn hàng
function renderOrders(orders) {
  const orderList = document.getElementById("order-list");
  if (!orderList) {
    console.error("Không tìm thấy order-list trong HTML");
    return;
  }

  // Kiểm tra nếu orders không phải mảng hoặc rỗng
  if (!Array.isArray(orders) || orders.length === 0) {
    orderList.innerHTML =
      "<tr><td colspan='6'>Không có đơn hàng nào.</td></tr>";
    return;
  }

  orderList.innerHTML = orders
    .map((order) => {
      return `
        <tr>
          <td>${order.orderId}</td>
          <td>${order.customerName}</td>
          <td>${new Date(order.orderDate).toLocaleDateString("vi-VN")}</td>
          <td>${order.totalPrice.toLocaleString()}đ</td>
          <td class="status-${order.status.toLowerCase()}">${order.status}</td>
          <td><a href="OrderDetail.html?orderId=${
            order.orderId
          }">Xem chi tiết</a></td>
          <td>
            ${
              order.status === "Pending"
                ? `
                <button class="btn-confirm" onclick="confirmOrder(${order.orderId})">Xác nhận</button>
                <button class="btn-cancel" onclick="cancelOrder(${order.orderId})">Hủy</button>
              `
                : order.status === "Shipped"
                ? `
                <button class="btn-update" onclick="updateOrderStatus(${order.orderId}, 'Delivered')">Đã giao</button>
                <button class="btn-cancel" onclick="cancelOrder(${order.orderId})">Hủy</button>
              `
                : `<button disabled>Đã xử lý</button>`
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

// Hàm xác nhận đơn hàng
async function confirmOrder(orderId) {
  Swal.fire({
    icon: "question",
    title: "Xác nhận đơn hàng",
    text: "Bạn có chắc chắn muốn xác nhận đơn hàng này?",
    showCancelButton: true,
    confirmButtonText: "Xác nhận",
    cancelButtonText: "Hủy",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/orders/${orderId}/confirm`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );

        const result = await response.json();
        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Xác nhận đơn hàng thành công!",
          });
          await loadOrders(); // Tải lại danh sách
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: result.message || "Lỗi khi xác nhận đơn hàng.",
          });
        }
      } catch (error) {
        console.error("Lỗi khi xác nhận đơn hàng:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
        });
      }
    }
  });
}

// Hàm cập nhật trạng thái đơn hàng
async function updateOrderStatus(orderId, newStatus) {
  Swal.fire({
    icon: "question",
    title: "Cập nhật trạng thái",
    text: `Cập nhật trạng thái đơn hàng thành "${newStatus}"?`,
    showCancelButton: true,
    confirmButtonText: "Xác nhận",
    cancelButtonText: "Hủy",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/orders/${orderId}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        const result = await response.json();
        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Cập nhật trạng thái thành công!",
          });
          await loadOrders(); // Tải lại danh sách
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: result.message || "Lỗi khi cập nhật trạng thái.",
          });
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
        });
      }
    }
  });
}

// Hàm hủy đơn hàng
async function cancelOrder(orderId) {
  Swal.fire({
    icon: "warning",
    title: "Hủy đơn hàng",
    text: "Bạn có chắc chắn muốn hủy đơn hàng này?",
    showCancelButton: true,
    confirmButtonText: "Hủy",
    cancelButtonText: "Quay lại",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/orders/${orderId}/cancel`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );

        const result = await response.json();
        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Hủy đơn hàng thành công!",
          });
          await loadOrders(); // Tải lại danh sách
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: result.message || "Lỗi khi hủy đơn hàng.",
          });
        }
      } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
        });
      }
    }
  });
}

// New function to check if a book is part of a pending order
async function isBookInPendingOrder(bookId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const result = await response.json();
    if (result.success && result.data && Array.isArray(result.data.$values)) {
      const pendingOrders = result.data.$values.filter(
        (order) => order.status === "Pending"
      );

      return pendingOrders.some((order) =>
        order.orderDetails.some((detail) => detail.bookId === bookId)
      );
    }
    return false;
  } catch (error) {
    console.error("Error checking pending orders:", error);
    return false;
  }
}

// Modify the deleteBook function to include the check
async function deleteBook(bookId) {
  const isPending = await isBookInPendingOrder(bookId);
  if (isPending) {
    Swal.fire({
      icon: "warning",
      title: "Không thể xóa",
      text: "Sách này đang thuộc một đơn hàng ở trạng thái 'Chờ xác nhận'.",
    });
    return;
  }

  const confirmation = await Swal.fire({
    title: "Bạn có chắc muốn xóa sách này?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  });

  if (!confirmation.isConfirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
      method: "DELETE",
    });

    const result = await response.json();
    if (result.success) {
      await Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Xóa sách thành công!",
      });
      await loadBooks();
    } else {
      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Lỗi khi xóa sách.",
      });
    }
  } catch (error) {
    console.error("Lỗi khi xóa sách:", error);
    await Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Các hàm chung
function handleSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const keyword = searchInput.value.trim();
      if (keyword) {
        Swal.fire({
          icon: "info",
          title: "Tìm kiếm",
          text: `Đang tìm kiếm sách với từ khóa: "${keyword}"`,
        }).then(() => {
          window.location.href = `../html/book-list.html?search=${encodeURIComponent(
            keyword
          )}`;
        });
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

// Hàm render phần đăng nhập
function renderLoginSection() {
  const loginSection = document.getElementById("login-section");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!loginSection) return;

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
    loginSection.innerHTML = `
        <div class="login__user">
          <img src="../img/login.svg" alt="Avatar" />
          <span>${user.fullName}</span>
        </div>
        <div class="login__dropdown-content">
          <a href="../html/Admin.html">Quản lý</a>
          <a href="#" id="logout-btn">Đăng xuất</a>
        </div>
      `;
    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.reload();
    });
  }
}
