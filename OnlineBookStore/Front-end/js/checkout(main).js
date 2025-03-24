const API_BASE_URL = "http://localhost:5000/api";

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
    updateTotal(selectedItems);
  } else {
    document.getElementById("order-items").innerHTML =
      "<p>Không có sản phẩm nào được chọn.</p>";
    document.getElementById("total-price").textContent = formatPrice(0);
  }
}

// Hàm render danh sách sách trong giỏ hàng
function renderCartItems(cartItems) {
  const orderItemsContainer = document.getElementById("order-items");
  orderItemsContainer.innerHTML = ""; // Xóa dữ liệu cũ trước khi render

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

// Hàm tính tổng tiền đơn hàng
function updateTotal(cartItems) {
  const total = cartItems.reduce(
    (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
    0
  );
  document.getElementById("total-price").textContent = formatPrice(total);
}

// Hàm fetch danh sách phương thức thanh toán từ API
async function fetchPaymentMethods() {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-methods`);
    const methods = await response.json();
    renderPaymentMethods(methods);
  } catch (error) {
    console.error("Lỗi khi tải phương thức thanh toán:", error);
  }
}

// Hàm render phương thức thanh toán lên giao diện
function renderPaymentMethods(methods) {
  const paymentContainer = document.querySelector(".payment-options");
  paymentContainer.innerHTML = ""; // Xóa nội dung cũ trước khi render

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

document
  .getElementById("place-order-btn")
  .addEventListener("click", async () => {
    const selectedItems = JSON.parse(localStorage.getItem("selectedCartItems"));
    const fullName = document.getElementById("full-name").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const paymentMethod = document.querySelector(
      'input[name="payment-method"]:checked'
    ).value;

    const orderData = {
      items: selectedItems,
      shippingInfo: { fullName, phone, address },
      paymentMethod,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (response.ok) {
        alert("Đặt hàng thành công!");
        localStorage.removeItem("selectedCartItems"); // Xóa sau khi đặt hàng
        window.location.href = "../html/index.html";
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Có lỗi khi đặt hàng!");
    }
  });

// Hàm fetch danh sách voucher
async function fetchVouchers() {
  try {
    let vouchers;

    if (backendAvailable()) {
      // Fetch từ backend nếu có API
      const response = await fetch(API_URL);
      vouchers = await response.json();
    } else {
      // Fetch từ file JSON nếu chưa có backend
      const response = await fetch("../data/vouchers.json");
      vouchers = await response.json();
    }

    renderVouchers(vouchers);
  } catch (error) {
    console.error("Lỗi khi tải danh sách voucher:", error);
    document.getElementById("voucher-select").innerHTML =
      '<option value="">Lỗi tải mã giảm giá</option>';
  }
}
// Hàm render danh sách mã giảm giá
function renderVouchers(vouchers) {
  const voucherSelect = document.getElementById("voucher-select");
  voucherSelect.innerHTML = ""; // Xóa dữ liệu cũ

  if (vouchers.length === 0) {
    voucherSelect.innerHTML = '<option value="">Không có mã giảm giá</option>';
    return;
  }

  voucherSelect.innerHTML = '<option value="">Chọn mã giảm giá</option>';
  vouchers.forEach((voucher) => {
    const option = document.createElement("option");
    option.value = voucher.discountAmount;
    option.textContent = `${voucher.code} (-${formatPrice(
      voucher.discountAmount
    )})`;
    voucherSelect.appendChild(option);
  });

  // Gắn sự kiện khi chọn voucher
  voucherSelect.addEventListener("change", applyVoucher);
}

// Hàm cập nhật tổng tiền khi áp dụng mã giảm giá
function applyVoucher() {
  const selectedDiscount =
    parseInt(document.getElementById("voucher-select").value) || 0;
  const cartItems = JSON.parse(localStorage.getItem("selectedCartItems")) || [];

  const total = cartItems.reduce(
    (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
    0
  );
  const newTotal = total - selectedDiscount;

  document.getElementById("discount-amount").textContent =
    formatPrice(selectedDiscount);
  document.getElementById("total-price").textContent = formatPrice(
    newTotal > 0 ? newTotal : 0
  );
}

// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Khi trang load, fetch dữ liệu giỏ hàng và phương thức thanh toán
document.addEventListener("DOMContentLoaded", () => {
  fetchCartItems();
  fetchPaymentMethods();
  fetchVouchers();
});
