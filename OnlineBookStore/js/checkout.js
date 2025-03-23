// Hàm fetch dữ liệu giỏ hàng từ file checkout.json
async function fetchCartItems() {
  try {
    const response = await fetch("../data/checkout.json");
    const cartItems = await response.json();
    renderCartItems(cartItems);
    updateTotal(cartItems);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu giỏ hàng:", error);
    document.getElementById("order-items").innerHTML =
      "<p>Lỗi khi tải dữ liệu giỏ hàng.</p>";
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
              item.price * item.quantity
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
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  document.getElementById("total-price").textContent = formatPrice(total);
}

// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Khi trang load, fetch dữ liệu giỏ hàng
document.addEventListener("DOMContentLoaded", () => {
  fetchCartItems();
});

// Hàm fetch danh sách phương thức thanh toán từ JSON
async function fetchPaymentMethods() {
  try {
    const response = await fetch("../data/payment_methods.json");
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

// Khi trang load, fetch danh sách phương thức thanh toán
document.addEventListener("DOMContentLoaded", () => {
  fetchPaymentMethods();
});
