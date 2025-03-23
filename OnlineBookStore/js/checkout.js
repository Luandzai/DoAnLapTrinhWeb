// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Hàm fetch dữ liệu giỏ hàng từ localStorage
function fetchCartItems() {
  const selectedItems = JSON.parse(localStorage.getItem("selectedCartItems"));
  if (selectedItems && selectedItems.length > 0) {
    renderCartItems(selectedItems);
    updateTotalWithShipping();
  } else {
    document.getElementById("order-items").innerHTML =
      "<p>Không có sản phẩm nào được chọn.</p>";
    document.getElementById("subtotal").textContent = formatPrice(0);
    document.getElementById("shipping-fee").textContent = formatPrice(0);
    document.getElementById("discount-amount").textContent = formatPrice(0);
    document.getElementById("total-price").textContent = formatPrice(0);
  }
}

// Hàm render danh sách sách trong giỏ hàng
function renderCartItems(cartItems) {
  const orderItemsContainer = document.getElementById("order-items");
  orderItemsContainer.innerHTML = "";

  cartItems.forEach((item) => {
    const itemHTML = `
      <div class="order-item">
        <img src="${item.coverImage}" alt="${item.title}" />
        <div class="order-item__info">
          <p class="order-item__title">${item.title}</p>
          <p class="order-item__quantity">Số lượng: ${item.quantity}</p>
          <p class="order-item__price">${formatPrice(
            (item.discountPrice || item.price) * item.quantity
          )}</p>
        </div>
      </div>
    `;
    orderItemsContainer.innerHTML += itemHTML;
  });
}

// Hàm fetch danh sách voucher từ JSON
async function fetchVouchers() {
  const voucherSelect = document.getElementById("voucher-select");
  if (!voucherSelect) return;

  try {
    const response = await fetch("../data/vouchers.json");
    const vouchers = await response.json();
    renderVouchers(vouchers);
  } catch (error) {
    console.error("Lỗi khi tải danh sách voucher:", error);
    voucherSelect.innerHTML = '<option value="">Lỗi tải mã giảm giá</option>';
  }
}

// Hàm render danh sách mã giảm giá
function renderVouchers(vouchers) {
  const voucherSelect = document.getElementById("voucher-select");
  voucherSelect.innerHTML = '<option value="">Chọn mã giảm giá</option>';

  vouchers.forEach((voucher) => {
    const option = document.createElement("option");
    option.value = voucher.discountAmount;
    option.textContent = `${voucher.code} (-${formatPrice(
      voucher.discountAmount
    )})`;
    voucherSelect.appendChild(option);
  });

  voucherSelect.addEventListener("change", applyVoucher);
}

// Hàm áp dụng mã giảm giá
function applyVoucher() {
  updateTotalWithShipping();
}

// Hàm fetch danh sách danh mục từ file JSON cho header
async function fetchCategories() {
  try {
    const response = await fetch("../data/cart.json");
    const data = await response.json();
    const categories = data.categories;
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
  } catch (error) {
    console.error("Error fetching categories:", error);
    document.getElementById("category-list").innerHTML =
      '<div class="nav__dropdown-item">Lỗi tải danh mục</div>';
  }
}

// Hàm fetch danh sách phương thức thanh toán từ file JSON
async function fetchPaymentMethods() {
  try {
    const response = await fetch("../data/payment_methods.json");
    const methods = await response.json();
    renderPaymentMethods(methods);
  } catch (error) {
    console.error("Lỗi khi tải phương thức thanh toán:", error);
    const paymentContainer = document.querySelector(".payment-options");
    paymentContainer.innerHTML = "<p>Lỗi tải phương thức thanh toán</p>";
  }
}

// Hàm render phương thức thanh toán lên giao diện
function renderPaymentMethods(methods) {
  const paymentContainer = document.querySelector(".payment-options");
  paymentContainer.innerHTML = "";

  methods.forEach((method, index) => {
    const methodHTML = `
      <label>
        <input type="radio" name="payment-method" value="${method.id}" ${
      index === 0 ? "checked" : ""
    } />
        ${method.name}
      </label>
    `;
    paymentContainer.innerHTML += methodHTML;
  });
}

// Hàm fetch danh sách tỉnh/thành phố từ JSON
async function fetchProvinces() {
  const provinceSelect = document.getElementById("province");
  if (!provinceSelect) return;

  try {
    const response = await fetch("../data/shipping_fees.json");
    const shippingData = await response.json();
    renderProvinces(shippingData);
  } catch (error) {
    console.error("Lỗi tải danh sách tỉnh/thành phố:", error);
  }
}

// Hàm render tỉnh/thành phố
function renderProvinces(shippingData) {
  const provinceSelect = document.getElementById("province");
  provinceSelect.innerHTML = '<option value="">Chọn tỉnh/thành phố</option>';

  shippingData.forEach((province) => {
    const option = document.createElement("option");
    option.value = province.fee;
    option.textContent = province.province;
    provinceSelect.appendChild(option);
  });

  provinceSelect.addEventListener("change", updateShippingFee);
}

// Hàm cập nhật phí vận chuyển
function updateShippingFee() {
  const selectedFee = parseInt(document.getElementById("province").value) || 0;
  document.getElementById("shipping-fee").textContent =
    formatPrice(selectedFee);
  updateTotalWithShipping();
}

// Hàm cập nhật tổng tiền (gồm giảm giá & phí ship)
function updateTotalWithShipping() {
  const selectedDiscount =
    parseInt(document.getElementById("voucher-select")?.value) || 0;
  const selectedFee = parseInt(document.getElementById("province")?.value) || 0;
  const cartItems = JSON.parse(localStorage.getItem("selectedCartItems")) || [];

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
    0
  );
  const newTotal = subtotal - selectedDiscount + selectedFee;

  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("shipping-fee").textContent =
    formatPrice(selectedFee);
  document.getElementById("discount-amount").textContent =
    formatPrice(selectedDiscount);
  document.getElementById("total-price").textContent = formatPrice(
    newTotal > 0 ? newTotal : 0
  );
}

// Xử lý khi nhấn nút "Xác nhận đặt hàng" (không cần backend)
document.getElementById("place-order-btn").addEventListener("click", () => {
  const selectedItems = JSON.parse(localStorage.getItem("selectedCartItems"));
  const fullName = document.getElementById("full-name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const paymentMethod = document.querySelector(
    'input[name="payment-method"]:checked'
  )?.value;

  // Kiểm tra dữ liệu đầu vào
  if (!selectedItems || selectedItems.length === 0) {
    alert("Không có sản phẩm nào để đặt hàng!");
    return;
  }
  if (!fullName || !phone || !address) {
    alert("Vui lòng điền đầy đủ thông tin giao hàng!");
    return;
  }
  if (!paymentMethod) {
    alert("Vui lòng chọn phương thức thanh toán!");
    return;
  }

  // Tạo dữ liệu đơn hàng (chỉ để log hoặc sử dụng sau này)
  const orderData = {
    items: selectedItems,
    shippingInfo: { fullName, phone, address },
    paymentMethod,
  };

  // Mô phỏng đặt hàng thành công
  console.log("Order data:", orderData); // Log dữ liệu để kiểm tra
  alert("Đặt hàng thành công!");
  localStorage.removeItem("selectedCartItems"); // Xóa dữ liệu sau khi đặt hàng
  window.location.href = "../html/index.html"; // Chuyển hướng về trang chủ
});

// Khi trang load, fetch dữ liệu và gắn sự kiện
document.addEventListener("DOMContentLoaded", () => {
  fetchCartItems();
  fetchCategories();
  fetchPaymentMethods();
  fetchVouchers();
  fetchProvinces();
});
