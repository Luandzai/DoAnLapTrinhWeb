// Định nghĩa API base URL
const API_BASE_URL = "http://localhost:5000/api";

// Hàm định dạng giá tiền
function formatPrice(amount) {
  if (!amount || isNaN(amount)) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
}

// Render danh sách sản phẩm đã chọn
function renderSelectedBooks() {
  const orderItemsContainer = document.getElementById("order-items");
  const checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];

  if (checkoutItems.length === 0) {
    orderItemsContainer.innerHTML = "<p>Không có sản phẩm nào được chọn.</p>";
    return;
  }

  orderItemsContainer.innerHTML = checkoutItems
    .map(
      (item) => `
      <div class="order-item">
          <img src="${item.coverImage}" alt="${item.title}">
          <div class="order-item__info">
              <p class="order-item__title">${item.title}</p>
              <p class="order-item__price" data-price="${
                item.price || 0
              }">${formatPrice(item.price)}</p>
              <p class="order-item__quantity">Số lượng: ${item.quantity}</p>
          </div>
      </div>`
    )
    .join("");

  updateTotalPrice();
}

// Cập nhật phí vận chuyển khi chọn tỉnh/thành phố
function updateShippingFee() {
  const provinceSelect = document.getElementById("province");
  const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
  const shippingFee = parseInt(selectedOption.dataset.fee) || 0;

  document.getElementById("shipping-fee").textContent =
    formatPrice(shippingFee);
  updateTotalPrice();
}

// Hàm lấy và render mã giảm giá của người dùng
async function renderUserDiscounts() {
  const voucherSelect = document.getElementById("voucher-select");
  if (!voucherSelect) {
    console.error("Không tìm thấy phần tử #voucher-select");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.userId) {
    voucherSelect.innerHTML =
      '<option value="">Vui lòng đăng nhập để sử dụng mã giảm giá</option>';
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/Discounts/user/${user.userId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    // Xử lý dữ liệu trả về có dạng { "$values": [...] }
    const discounts = data.$values || data;

    if (!Array.isArray(discounts)) {
      console.error("Dữ liệu discounts không phải là mảng:", discounts);
      voucherSelect.innerHTML =
        '<option value="">Lỗi dữ liệu mã giảm giá</option>';
      return;
    }

    if (discounts.length === 0) {
      voucherSelect.innerHTML =
        '<option value="">Không có mã giảm giá nào</option>';
    } else {
      voucherSelect.innerHTML =
        '<option value="">Chọn mã giảm giá</option>' +
        discounts
          .map(
            (discount) => `
              <option value="${discount.discountId}" data-amount="${
              discount.discountAmount
            }">
                ${discount.code} - Giảm ${formatPrice(discount.discountAmount)}
              </option>
            `
          )
          .join("");
    }

    voucherSelect.addEventListener("change", updateDiscount);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách mã giảm giá:", error);
    voucherSelect.innerHTML =
      '<option value="">Lỗi khi tải mã giảm giá</option>';
  }
}

// Cập nhật giá trị giảm giá và tổng tiền
function updateDiscount() {
  const voucherSelect = document.getElementById("voucher-select");
  const selectedOption = voucherSelect.options[voucherSelect.selectedIndex];
  const discountAmount = parseInt(selectedOption.dataset.amount) || 0;

  document.getElementById("discount-amount").textContent =
    formatPrice(discountAmount);
  updateTotalPrice();
}

// Tính tổng tiền đơn hàng
function updateTotalPrice() {
  const checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const shippingFee =
    parseInt(
      document.getElementById("shipping-fee").textContent.replace(/[^\d]/g, "")
    ) || 0;

  const discountAmount =
    parseInt(
      document
        .getElementById("discount-amount")
        .textContent.replace(/[^\d]/g, "")
    ) || 0;

  const totalPrice = subtotal + shippingFee - discountAmount;

  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("shipping-fee").textContent =
    formatPrice(shippingFee);
  document.getElementById("discount-amount").textContent =
    formatPrice(discountAmount);
  document.getElementById("total-price").textContent = formatPrice(totalPrice);
}

// Hàm render phần login dựa trên trạng thái đăng nhập
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

    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.reload();
    });
  }
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

// Hàm xử lý khi nhấn nút "Xác nhận đặt hàng"
async function handlePlaceOrder() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.userId) {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Vui lòng đăng nhập để đặt hàng!",
    });
    window.location.href = "../html/Login.html";
    return;
  }

  // Thu thập thông tin từ giao diện
  const fullName = document.getElementById("full-name").value.trim();
  const phoneNumber = document.getElementById("phone").value.trim();
  const provinceSelect = document.getElementById("province");
  const province = provinceSelect.options[provinceSelect.selectedIndex].value;
  const shippingFee =
    parseInt(
      provinceSelect.options[provinceSelect.selectedIndex].dataset.fee
    ) || 0;
  const paymentMethod = document.querySelector(
    'input[name="payment-method"]:checked'
  ).value;
  const voucherSelect = document.getElementById("voucher-select");
  const discountId = parseInt(voucherSelect.value) || null;
  const checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
  const totalPrice =
    parseInt(
      document.getElementById("total-price").textContent.replace(/[^\d]/g, "")
    ) || 0;

  // Kiểm tra dữ liệu đầu vào
  if (!fullName || !phoneNumber || !province) {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Vui lòng điền đầy đủ thông tin: Họ và Tên, Số điện thoại, Tỉnh/Thành phố!",
    });
    return;
  }

  if (!/^\d{10}$/.test(phoneNumber)) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Số điện thoại phải có đúng 10 chữ số!",
    });
    return;
  }

  if (checkoutItems.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi đặt hàng.",
    });
    return;
  }

  // Chuẩn bị dữ liệu gửi lên API
  const orderData = {
    userId: user.userId,
    shippingAddress: `${fullName}, ${phoneNumber}, ${province}`, // Kết hợp thông tin thành địa chỉ giao hàng
    paymentMethod: paymentMethod,
    shippingFee: shippingFee,
    totalPrice: totalPrice,
    discountId: discountId,
    orderItems: checkoutItems.map((item) => ({
      bookId: item.bookId,
      quantity: item.quantity,
      unitPrice: item.price,
    })),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/Orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Lỗi khi đặt hàng!");
    }

    Swal.fire({
      icon: "success",
      title: "Thành công",
      text: result.message,
    }).then(() => {
      localStorage.removeItem("checkoutItems");
      window.location.href = "../html/index.html";
    });
  } catch (error) {
    console.error("Lỗi khi đặt hàng:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: error.message || "Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!",
    });
  }
}

// Thêm sự kiện và load dữ liệu khi trang được tải
document.addEventListener("DOMContentLoaded", async () => {
  const provinceSelect = document.getElementById("province");
  const placeOrderBtn = document.querySelector(".place-order-btn");

  // Thêm sự kiện cho nút "Xác nhận đặt hàng"
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", handlePlaceOrder);
  }

  // Load danh sách tỉnh/thành phố và phí vận chuyển
  try {
    const response = await fetch(`${API_BASE_URL}/ShippingFees`);
    const data = await response.json();
    const provinces = data.$values || [];

    provinceSelect.innerHTML += provinces
      .map(
        (item) =>
          `<option value="${item.province}" data-fee="${item.fee}">${item.province}</option>`
      )
      .join("");

    provinceSelect.addEventListener("change", () => {
      updateShippingFee();
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error);
  }

  // Gọi các hàm render
  renderSelectedBooks();
  await renderUserDiscounts();
  renderLoginSection();
  await fetchCategories();
  handleSearch();
});
