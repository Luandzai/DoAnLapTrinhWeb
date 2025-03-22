// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Hàm lấy danh mục từ file JSON
async function fetchCategories() {
  try {
    const response = await fetch("../data/cart.json");
    const data = await response.json();
    const categories = data.categories; // Lấy mảng categories từ JSON
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

// Hàm lấy giỏ hàng từ file JSON
async function fetchCartItems(cartItems = null) {
  try {
    let items = cartItems;
    if (!items) {
      const response = await fetch("../data/cart.json");
      const data = await response.json();
      items = data.cart; // Lấy mảng cart từ JSON
    }

    const cartContent = document.getElementById("cart-content");
    const cartTitle = document.getElementById("cart-title");

    cartTitle.textContent = `GIỎ HÀNG (${items.length} sản phẩm)`;

    cartContent.innerHTML = items
      .map(
        (item) => `
            <div class="cart-item">
              <div class="cart-checkbox">
                <input type="checkbox" id="checkbox-product-${
                  item.id
                }" name="checkbox_product_${
          item.id
        }" class="checkbox-add-cart" />
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

    addCartEventListeners(items);
    updateCartTotal(items);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    document.getElementById("cart-content").innerHTML =
      '<div class="cart-item">Lỗi tải giỏ hàng</div>';
  }
}

// Thêm sự kiện cho các nút trong giỏ hàng
function addCartEventListeners(cartItems) {
  document.querySelectorAll(".btn-qty").forEach((button) => {
    button.addEventListener("click", (e) => {
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
      updateCartTotal(cartItems);
    });
  });

  document.querySelectorAll(".cart-remove").forEach((button) => {
    button.addEventListener("click", (e) => {
      const cartItem = e.target.closest(".cart-item");
      const index = Array.from(document.querySelectorAll(".cart-item")).indexOf(
        cartItem
      );
      cartItems.splice(index, 1);
      fetchCartItems(cartItems); // Render lại với mảng đã cập nhật
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
