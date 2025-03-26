// API endpoints
const API_BASE_URL = "http://localhost:5000/api";

// Hàm định dạng giá tiền
const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

// Hàm xử lý API chung
const fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${text}`);
    }
    const data = await response.json();
    return data.$values || data; // Hỗ trợ dữ liệu dạng $values từ ASP.NET
  } catch (error) {
    console.error(`❌ Lỗi khi gọi API ${url}:`, error);
    throw error;
  }
};

// Hàm lấy giỏ hàng từ API
const fetchCart = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Vui lòng đăng nhập để xem giỏ hàng!");
    window.location.href = "../html/Login.html";
    return [];
  }

  try {
    const cartItems = await fetchAPI(
      `${API_BASE_URL}/Carts?userId=${user.userId}`
    );
    if (!Array.isArray(cartItems)) {
      console.error("Dữ liệu giỏ hàng không phải là mảng:", cartItems);
      return [];
    }
    // API đã gộp trùng lặp, không cần xử lý thêm ở client
    return cartItems.filter((item) => item.book); // Lọc bỏ các item không có thông tin sách
  } catch (error) {
    return [];
  }
};

// Hàm cập nhật số lượng trong giỏ hàng
const updateCartItem = async (cartId, quantity) => {
  const result = await fetchAPI(`${API_BASE_URL}/Carts/${cartId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
  return result;
};

// Hàm xóa mục khỏi giỏ hàng
const removeCartItem = async (cartId) => {
  const result = await fetchAPI(`${API_BASE_URL}/Carts/${cartId}`, {
    method: "DELETE",
  });
  return result;
};

// Hàm lấy danh mục từ API
const fetchCategories = async () => {
  try {
    const categories = await fetchAPI(`${API_BASE_URL}/Categories`);
    if (!Array.isArray(categories)) {
      throw new Error("Dữ liệu danh mục không phải là mảng");
    }
    return categories;
  } catch (error) {
    return [];
  }
};

// Hàm render giỏ hàng
const renderCart = (cartItems) => {
  const cartList = document.getElementById("cart-list");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (!cartList || !cartTotal || !cartCount || !checkoutBtn) {
    console.error("Thiếu các phần tử HTML cần thiết cho giỏ hàng");
    return;
  }

  if (cartItems.length === 0) {
    cartList.innerHTML = "<p>Giỏ hàng của bạn đang trống.</p>";
    cartTotal.textContent = "0 đ";
    cartCount.textContent = "0";
    checkoutBtn.disabled = true;
    checkoutBtn.style.backgroundColor = "#e74c3c";
    return;
  }

  const total = cartItems.reduce((sum, item) => {
    const price = item.book.discountPrice || item.book.price;
    return sum + price * item.quantity;
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  cartList.innerHTML = cartItems
    .map(
      (item) => `
          <div class="cart__item" data-cart-id="${item.cartId}">
              <input type="checkbox" class="cart__checkbox" data-cart-id="${
                item.cartId
              }">
              <a href="../html/book-detail.html?id=${item.book.bookId}">
                  <img class="cart__item-image" src="${
                    item.book.coverImage || "placeholder.jpg"
                  }" alt="${item.book.title}" data-book-id="${
        item.book.bookId
      }"/>
              </a>
              <div class="cart__item-info">
                  <h3 class="cart__item-title" data-book-id="${
                    item.book.bookId
                  }">${item.book.title}</h3>
                  <p class="cart__item-price">${formatPrice(
                    item.book.discountPrice || item.book.price
                  )}</p>
                  <div class="cart__item-quantity">
                      <button class="cart__item-quantity-btn decrease">-</button>
                      <input type="number" class="cart__item-quantity-input" value="${
                        item.quantity
                      }" min="1" max="${item.book.stockQuantity || 999}" />
                      <button class="cart__item-quantity-btn increase">+</button>
                  </div>
              </div>
              <p class="cart__item-total">${formatPrice(
                (item.book.discountPrice || item.book.price) * item.quantity
              )}</p>
              <span class="cart__item-remove">Xóa</span>
          </div>
          `
    )
    .join("");

  cartTotal.textContent = formatPrice(total);
  cartCount.textContent = totalItems;
  checkoutBtn.disabled = false;
  checkoutBtn.style.backgroundColor = "#2ecc71";

  // Gắn sự kiện cho các nút
  document
    .querySelectorAll(".decrease, .increase")
    .forEach((btn) => btn.addEventListener("click", handleQuantityChange));
  document
    .querySelectorAll(".cart__item-quantity-input")
    .forEach((input) => input.addEventListener("change", handleQuantityInput));
  document
    .querySelectorAll(".cart__item-remove")
    .forEach((btn) => btn.addEventListener("click", handleRemoveItem));
};

// Hàm xử lý thay đổi số lượng bằng nút
const handleQuantityChange = async (e) => {
  const btn = e.target;
  const cartItem = btn.closest(".cart__item");
  const cartId = cartItem.dataset.cartId;
  const input = cartItem.querySelector(".cart__item-quantity-input");
  let quantity = parseInt(input.value);

  if (btn.classList.contains("increase")) quantity += 1;
  else if (btn.classList.contains("decrease") && quantity > 1) quantity -= 1;

  try {
    await updateCartItem(cartId, quantity);
    const cartItems = await fetchCart();
    renderCart(cartItems);
  } catch (error) {
    alert(error.message || "Cập nhật số lượng thất bại!");
  }
};

// Hàm xử lý nhập số lượng thủ công
const handleQuantityInput = async (e) => {
  const input = e.target;
  const cartItem = input.closest(".cart__item");
  const cartId = cartItem.dataset.cartId;
  const quantity = parseInt(input.value);

  if (quantity < 1 || quantity > parseInt(input.max)) {
    alert("Số lượng không hợp lệ!");
    input.value = input.defaultValue;
    return;
  }

  try {
    await updateCartItem(cartId, quantity);
    const cartItems = await fetchCart();
    renderCart(cartItems);
  } catch (error) {
    alert(error.message || "Cập nhật số lượng thất bại!");
  }
};

// Hàm xử lý xóa mục
const handleRemoveItem = async (e) => {
  const cartId = e.target.closest(".cart__item").dataset.cartId;
  try {
    await removeCartItem(cartId);
    const cartItems = await fetchCart();
    renderCart(cartItems);
  } catch (error) {
    alert(error.message || "Xóa mục thất bại!");
  }
};

// Hàm render phần login
const renderLoginSection = () => {
  const loginSection = document.getElementById("login-section");
  if (!loginSection) return;

  const user = JSON.parse(localStorage.getItem("user"));
  loginSection.innerHTML = user
    ? `
        <div class="login__user">
          <img src="../img/login.svg" alt="Avatar" />
          <span>${user.fullName}</span>
        </div>
        <div class="login__dropdown-content">
          ${
            user.role === "Admin"
              ? '<a href="../html/admin.html">Quản lý</a>'
              : '<a href="../html/user.html">Thông tin cá nhân</a>'
          }
          <a href="#" id="logout-btn">Đăng xuất</a>
        </div>
      `
    : `
        <button class="login__dropdown-btn">
          <img src="../img/Login.svg" alt="Đăng nhập" />
        </button>
        <div class="login__dropdown-content">
          <a href="./Login.html">Đăng Nhập</a>
        </div>
      `;

  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    window.location.reload();
  });
};

// Hàm xử lý ô tìm kiếm
const handleSearch = () => {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchInput.value.trim()) {
      window.location.href = `../html/book-list.html?search=${encodeURIComponent(
        searchInput.value.trim()
      )}`;
    }
  });
};

// Hàm render danh mục
const renderCategories = (categories) => {
  const categoryList = document.getElementById("category-list");
  if (!categoryList) return;

  categoryList.innerHTML =
    categories.length === 0
      ? '<div class="nav__dropdown-item">Không có danh mục</div>'
      : categories
          .map(
            (category) => `
              <div class="nav__dropdown-item">
                <a href="../html/book-list.html?categoryId=${
                  category.categoryId
                }">
                  ${category.categoryName}
                </a>
                ${
                  category.subCategories?.length
                    ? `<div class="nav__dropdown-subcontent">
                        ${category.subCategories
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
            `
          )
          .join("");
};

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  const cartItems = await fetchCart();
  renderCart(cartItems);

  renderLoginSection();
  handleSearch();

  const categories = await fetchCategories();
  renderCategories(categories);
  // Xử lý chọn tất cả
  document.getElementById("select-all")?.addEventListener("change", (e) => {
    document.querySelectorAll(".cart__checkbox").forEach((checkbox) => {
      checkbox.checked = e.target.checked;
    });
  });

  // Xử lý xóa các mục được chọn
  document
    .getElementById("delete-selected")
    ?.addEventListener("click", async () => {
      const selectedItems = [
        ...document.querySelectorAll(".cart__checkbox:checked"),
      ];
      if (selectedItems.length === 0) {
        alert("Vui lòng chọn ít nhất một sản phẩm để xóa!");
        return;
      }

      const confirmDelete = confirm(
        `Bạn có chắc muốn xóa ${selectedItems.length} sản phẩm khỏi giỏ hàng?`
      );
      if (!confirmDelete) return;

      for (const checkbox of selectedItems) {
        await removeCartItem(checkbox.dataset.cartId);
      }

      const updatedCart = await fetchCart();
      renderCart(updatedCart);
    });
  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    const selectedItems = [
      ...document.querySelectorAll(".cart__checkbox:checked"),
    ];

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    const selectedBooks = selectedItems.map((checkbox) => {
      const cartItem = checkbox.closest(".cart__item");
      const priceText = cartItem
        .querySelector(".cart__item-price")
        .textContent.replace(/[^\d]/g, ""); // Lấy giá từ text, loại bỏ ký tự không phải số
      return {
        cartId: checkbox.dataset.cartId,
        bookId: cartItem.querySelector(".cart__item-image").dataset.bookId, // Lấy từ ảnh
        title: cartItem.querySelector(".cart__item-title").textContent,
        price: parseInt(priceText) || 0, // Chuyển đổi giá từ text sang số
        quantity:
          parseInt(
            cartItem.querySelector(".cart__item-quantity-input").value
          ) || 1,
        coverImage:
          cartItem.querySelector(".cart__item-image").src ||
          "../img/default-book.jpg",
      };
    });

    localStorage.setItem("checkoutItems", JSON.stringify(selectedBooks));
    window.location.href = "../html/checkout.html";
  });
});
