// API endpoints
const API_BASE_URL = "http://localhost:5000/api";

// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Hàm lấy danh mục từ API
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const categories = await response.json();
    const categoryList = document.getElementById("category-list");
    categoryList.innerHTML = categories
      .map(
        (category) => `
          <div class="nav-dropdown-item">
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
      '<div class="nav-dropdown-item">Lỗi tải danh mục</div>';
  }
}

// Hàm lấy giỏ hàng từ API
async function fetchCartItems() {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`);
    const cartItems = await response.json();
    const cartContent = document.getElementById("cart-content");
    const cartTitle = document.getElementById("cart-title");

    cartTitle.textContent = `GIỎ HÀNG (${cartItems.length} sản phẩm)`;

    cartContent.innerHTML = cartItems
      .map(
        (item) => `
          <div class="cart-item">
            <div class="cart-checkbox">
              <input type="checkbox" id="checkbox-product-${
                item.id
              }" name="checkbox_product_${item.id}" class="checkbox-add-cart" />
            </div>
            <div class="cart-image">
              <a href="../html/book-detail.html?id=${item.id}">
                <img src="${item.coverImage}" width="120" height="120" alt="${
          item.title
        }" />
              </a>
            </div>
            <div class="cart-info">
              <h2 class="cart-title">
                <a href="../html/book-detail.html?id=${item.id}">${
          item.title
        }</a>
              </h2>
              <div class="cart-prices">
                <span class="cart-price-current">${formatPrice(
                  item.discountPrice || item.price
                )}</span>
                ${
                  item.discountPrice
                    ? `<span class="cart-price-old">${formatPrice(
                        item.price
                      )}</span>`
                    : ""
                }
              </div>
              <div class="cart-quantity">
                <button class="btn-qty decrease">-</button>
                <input type="text" value="${
                  item.quantity
                }" class="qty-input" readonly />
                <button class="btn-qty increase">+</button>
              </div>
            </div>
            <button class="cart-remove">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `
      )
      .join("");

    addCartEventListeners(cartItems);
    updateCartTotal(cartItems);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    document.getElementById("cart-content").innerHTML =
      '<div class="cart-item">Lỗi tải giỏ hàng</div>';
  }
}

// Thêm sự kiện cho các nút trong giỏ hàng
function addCartEventListeners(cartItems) {
  document.querySelectorAll(".btn-qty").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const cartItem = e.target.closest(".cart-item");
      const qtyInput = cartItem.querySelector(".qty-input");
      const index = Array.from(document.querySelectorAll(".cart-item")).indexOf(
        cartItem
      );
      let qty = parseInt(qtyInput.value);

      if (e.target.classList.contains("increase")) qty++;
      else if (e.target.classList.contains("decrease") && qty > 1) qty--;

      qtyInput.value = qty;
      cartItems[index].quantity = qty;

      // Cập nhật số lượng lên backend
      await fetch(`${API_BASE_URL}/cart/${cartItems[index].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      updateCartTotal(cartItems);
    });
  });

  document.querySelectorAll(".cart-remove").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const cartItem = e.target.closest(".cart-item");
      const index = Array.from(document.querySelectorAll(".cart-item")).indexOf(
        cartItem
      );
      await fetch(`${API_BASE_URL}/cart/${cartItems[index].id}`, {
        method: "DELETE",
      });
      cartItems.splice(index, 1);
      fetchCartItems();
    });
  });

  document.querySelectorAll(".checkbox-add-cart").forEach((checkbox) => {
    checkbox.addEventListener("change", () => updateCartTotal(cartItems));
  });
}

// Cập nhật tổng tiền
function updateCartTotal(cartItems) {
  let subtotal = 0;
  document.querySelectorAll(".cart-item").forEach((item, index) => {
    const checkbox = item.querySelector(".checkbox-add-cart");
    if (checkbox.checked) {
      const qty = parseInt(item.querySelector(".qty-input").value);
      const price = cartItems[index].discountPrice || cartItems[index].price;
      subtotal += price * qty;
    }
  });
  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("total").textContent = formatPrice(subtotal);
}

// Xử lý ô tìm kiếm
function handleSearch() {
  const searchInput = document.getElementById("search-input");
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

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", () => {
  fetchCategories();
  fetchCartItems();
  handleSearch();
});
