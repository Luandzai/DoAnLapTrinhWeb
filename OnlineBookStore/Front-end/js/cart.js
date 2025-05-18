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
    Swal.fire({
      icon: "warning",
      title: "Thông báo",
      text: "Vui lòng đăng nhập để xem giỏ hàng!",
    }).then(() => {
      window.location.href = "../html/Login.html";
    });
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
    console.log("Raw categories from API:", categories);
    if (!Array.isArray(categories)) {
      console.error("Dữ liệu danh mục không phải là mảng:", categories);
      return [];
    }
    // Xử lý subCategories để đảm bảo là mảng
    return categories.map((category) => ({
      ...category,
      subCategories: Array.isArray(category.subCategories?.$values)
        ? category.subCategories.$values
        : Array.isArray(category.subCategories)
        ? category.subCategories
        : [],
    }));
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    return [];
  }
};

// Hàm cập nhật số lượng sản phẩm trên badge
const updateCartBadge = (count) => {
  const cartBadge = document.getElementById("cart-badge");
  if (cartBadge) {
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? "inline-block" : "none"; // Ẩn badge nếu số lượng là 0
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
    updateCartBadge(0); // Cập nhật badge
    return;
  }

  // Hiển thị tổng số sản phẩm trong giỏ hàng
  cartCount.textContent = cartItems.length;
  updateCartBadge(cartItems.length); // Cập nhật badge

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
                  <p class="cart__item-price" data-price="${
                    item.book.discountPrice || item.book.price
                  }">${formatPrice(
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

  // Hàm tính tổng tiền dựa trên các sản phẩm được chọn
  const updateTotal = (items) => {
    console.log("updateTotal called with items:", items);
    const selectedItems = [
      ...document.querySelectorAll(".cart__checkbox:checked"),
    ];
    console.log("Selected items:", selectedItems);

    const total = selectedItems.reduce((sum, checkbox) => {
      const cartId = checkbox.dataset.cartId;
      const item = items.find((i) => i.cartId == cartId);
      if (!item || !item.book) {
        console.warn(`Không tìm thấy item hoặc book cho cartId: ${cartId}`);
        return sum;
      }
      const cartItem = checkbox.closest(".cart__item");
      const price = parseFloat(
        cartItem.querySelector(".cart__item-price").dataset.price
      );
      const quantity = parseInt(
        cartItem.querySelector(".cart__item-quantity-input").value
      );
      console.log(
        `Item: ${item.book.title}, Price: ${price}, Quantity: ${quantity}`
      );
      return sum + price * quantity;
    }, 0);

    console.log("Total:", total);

    cartTotal.textContent = formatPrice(total);
    checkoutBtn.disabled = selectedItems.length === 0;
    checkoutBtn.style.backgroundColor =
      selectedItems.length === 0 ? "#e74c3c" : "#2ecc71";
  };

  // Hàm cập nhật số lượng và tổng tiền mà không render lại
  const updateQuantityAndTotal = async (handler) => {
    await handler(); // Gọi API để cập nhật số lượng
    const updatedCartItems = await fetchCart(); // Lấy dữ liệu mới từ API

    // Cập nhật số lượng và tổng tiền trên giao diện
    updatedCartItems.forEach((item) => {
      const cartItem = document.querySelector(
        `.cart__item[data-cart-id="${item.cartId}"]`
      );
      if (cartItem) {
        const quantityInput = cartItem.querySelector(
          ".cart__item-quantity-input"
        );
        const totalPrice = cartItem.querySelector(".cart__item-total");
        quantityInput.value = item.quantity; // Cập nhật số lượng
        const price = item.book.discountPrice || item.book.price;
        totalPrice.textContent = formatPrice(price * item.quantity); // Cập nhật tổng tiền của sản phẩm
      }
    });

    // Cập nhật tổng số sản phẩm
    cartCount.textContent = updatedCartItems.length;
    updateCartBadge(updatedCartItems.length); // Cập nhật badge

    // Cập nhật tổng tiền
    updateTotal(updatedCartItems);
  };

  // Gắn sự kiện cho các nút và checkbox
  document.querySelectorAll(".decrease, .increase").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      updateQuantityAndTotal(() => handleQuantityChange(e));
    })
  );
  document.querySelectorAll(".cart__item-quantity-input").forEach((input) =>
    input.addEventListener("change", (e) => {
      updateQuantityAndTotal(() => handleQuantityInput(e));
    })
  );
  document.querySelectorAll(".cart__item-remove").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      await handleRemoveItem(e);
      const updatedCartItems = await fetchCart();
      renderCart(updatedCartItems); // Xóa thì cần render lại toàn bộ
    })
  );

  // Gắn sự kiện cho checkbox
  document.querySelectorAll(".cart__checkbox").forEach((checkbox) => {
    checkbox.removeEventListener("change", () => updateTotal(cartItems));
    checkbox.addEventListener("change", () => {
      console.log(
        `Checkbox ${checkbox.dataset.cartId} changed to ${checkbox.checked}`
      );
      updateTotal(cartItems);
    });
  });

  // Cập nhật tổng ban đầu
  updateTotal(cartItems);
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
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: error.message || "Cập nhật số lượng thất bại!",
    });
  }
};

// Hàm xử lý nhập số lượng thủ công
const handleQuantityInput = async (e) => {
  const input = e.target;
  const cartItem = input.closest(".cart__item");
  const cartId = cartItem.dataset.cartId;
  const quantity = parseInt(input.value);

  if (quantity < 1 || quantity > parseInt(input.max)) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Số lượng không hợp lệ!",
    });
    input.value = input.defaultValue;
    return;
  }

  try {
    await updateCartItem(cartId, quantity);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: error.message || "Cập nhật số lượng thất bại!",
    });
  }
};

// Hàm xử lý xóa mục
const handleRemoveItem = async (e) => {
  const cartId = e.target.closest(".cart__item").dataset.cartId;
  try {
    await removeCartItem(cartId);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: error.message || "Xóa mục thất bại!",
    });
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
  if (!categoryList) {
    console.error("Không tìm thấy category-list trong HTML");
    return;
  }

  console.log("Rendering categories:", categories);

  if (categories.length === 0) {
    categoryList.innerHTML =
      '<div class="nav__dropdown-item">Không có danh mục</div>';
    return;
  }

  categoryList.innerHTML = categories
    .map((category) => {
      if (!category.categoryId || !category.categoryName) {
        console.warn("Dữ liệu danh mục không hợp lệ:", category);
        return "";
      }
      const subCategories = category.subCategories || [];
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
                        console.warn("Dữ liệu danh mục con không hợp lệ:", sub);
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

  console.log("Rendered category HTML:", categoryList.innerHTML);
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
      const event = new Event("change");
      checkbox.dispatchEvent(event); // Kích hoạt sự kiện change để cập nhật tổng tiền
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
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo",
          text: "Vui lòng chọn ít nhất một sản phẩm để xóa!",
        });
        return;
      }

      Swal.fire({
        icon: "warning",
        title: "Xóa sản phẩm",
        text: `Bạn có chắc muốn xóa ${selectedItems.length} sản phẩm khỏi giỏ hàng?`,
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            for (const checkbox of selectedItems) {
              await removeCartItem(checkbox.dataset.cartId);
              Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Xóa sản phẩm thành công!",
              });
            }

            const updatedCart = await fetchCart();
            renderCart(updatedCart);
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Lỗi",
              text: error.message || "Xóa mục thất bại!",
            });
          }
        }
      });
    });

  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    const selectedItems = [
      ...document.querySelectorAll(".cart__checkbox:checked"),
    ];

    if (selectedItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng chọn ít nhất một sản phẩm để thanh toán!",
      });
      return;
    }

    const selectedBooks = selectedItems.map((checkbox) => {
      const cartItem = checkbox.closest(".cart__item");
      const price = parseFloat(
        cartItem.querySelector(".cart__item-price").dataset.price
      );
      return {
        cartId: checkbox.dataset.cartId,
        bookId: cartItem.querySelector(".cart__item-image").dataset.bookId,
        title: cartItem.querySelector(".cart__item-title").textContent,
        price: isNaN(price) ? 0 : price,
        quantity:
          parseInt(
            cartItem.querySelector(".cart__item-quantity-input").value
          ) || 1,
        coverImage:
          cartItem.querySelector(".cart__item-image").src ||
          "../img/default-book.jpg",
      };
    });

    console.log("Checkout items:", selectedBooks);
    localStorage.setItem("checkoutItems", JSON.stringify(selectedBooks));
    window.location.href = "../html/checkout.html";
  });
});
