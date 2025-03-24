// API endpoints
const API_BASE_URL = "http://localhost:5000/api";

// Hàm định dạng giá tiền
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Hàm tính phần trăm giảm giá
function calculateDiscount(originalPrice, discountPrice) {
  if (!originalPrice || !discountPrice) return 0;
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

// Hàm render sách
function renderBook(book) {
  return `
    <div class="book-item">
      <a href="../html/book-detail.html?id=${book.bookId}">
        <img src="${book.coverImage || "placeholder.jpg"}" alt="${book.title}">
      </a>
      <h3 class="book-name">${book.title}</h3>
      <div class="Gia">
        <span class="GiaHienTai">${formatPrice(
          book.discountPrice || book.price
        )}</span>
        ${
          book.discountPrice
            ? `<span class="discount">-${calculateDiscount(
                book.oldPrice || book.price,
                book.discountPrice
              )}%</span>`
            : ""
        }
      </div>
      ${
        book.oldPrice
          ? `<span class="GiaCu">${formatPrice(book.oldPrice)}</span>`
          : ""
      }
      <div class="DaBan">Đã bán ${book.soldQuantity || 0}</div>
    </div>
  `;
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

// Hàm lấy và hiển thị sách flash sale
async function fetchFlashSaleBooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/Books/FlashSale`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log("Flash Sale Data from API:", data);

    const books = data.$values || data;
    if (!Array.isArray(books)) {
      throw new Error("Dữ liệu sách flash sale không phải là mảng");
    }

    const flashSaleContainer = document.querySelector(".flash-sale__book-list");
    if (!flashSaleContainer) {
      console.error("Không tìm thấy flash-sale__book-list trong HTML");
      return;
    }

    flashSaleContainer.innerHTML = books.map(renderBook).join("");
  } catch (error) {
    console.error("❌ Lỗi tải sách flash sale:", error);
    const flashSaleContainer = document.querySelector(".flash-sale__book-list");
    if (flashSaleContainer) {
      flashSaleContainer.innerHTML = "<p>Lỗi tải sách flash sale</p>";
    }
  }
}

// Hàm lấy và hiển thị sách nổi bật (Featured Books)
async function fetchFeaturedBooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/Books/Featured`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log("Featured Books from API:", data);

    const books = data.$values || data;
    if (!Array.isArray(books)) {
      throw new Error("Dữ liệu sách nổi bật không phải là mảng");
    }

    const featuredBooksContainer = document.querySelector(
      ".featured-books__book-list"
    );
    if (!featuredBooksContainer) {
      console.error("Không tìm thấy featured-books__book-list trong HTML");
      return;
    }

    featuredBooksContainer.innerHTML = books.map(renderBook).join("");
  } catch (error) {
    console.error("❌ Lỗi tải sách nổi bật:", error);
    const featuredBooksContainer = document.querySelector(
      ".featured-books__book-list"
    );
    if (featuredBooksContainer) {
      featuredBooksContainer.innerHTML = "<p>Lỗi tải sách nổi bật</p>";
    }
  }
}

// Hàm lấy và hiển thị sách mới (New Books)
// async function fetchNewBooks() {
//   try {
//     const response = await fetch(`${API_BASE_URL}/Books`);
//     if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

//     const data = await response.json();
//     console.log("New Books from API:", data);

//     const books = data.$values || data;
//     if (!Array.isArray(books)) {
//       throw new Error("Dữ liệu sách mới không phải là mảng");
//     }

//     const newBooksContainer = document.querySelector(".new-books__book-list");
//     if (!newBooksContainer) {
//       console.error("Không tìm thấy new-books__book-list trong HTML");
//       return;
//     }

//     newBooksContainer.innerHTML = "";
//     let newBooksCount = 0;

//     books.forEach((book) => {
//       if (newBooksCount < 16) {
//         const bookElement = renderBook(book);
//         newBooksContainer.innerHTML += bookElement;
//         newBooksCount++;
//       }
//     });
//   } catch (error) {
//     console.error("❌ Lỗi tải sách mới:", error);
//     const newBooksContainer = document.querySelector(".new-books__book-list");
//     if (newBooksContainer) {
//       newBooksContainer.innerHTML = "<p>Lỗi tải sách mới</p>";
//     }
//   }
// }

async function fetchNewBooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/Books/New`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log("New Books from API:", data);

    const books = data.$values || data;
    if (!Array.isArray(books)) {
      throw new Error("Dữ liệu sách mới không phải là mảng");
    }

    const newBooksContainer = document.querySelector(".new-books__book-list");
    if (!newBooksContainer) {
      console.error("Không tìm thấy new-books__book-list trong HTML");
      return;
    }

    newBooksContainer.innerHTML = books.map(renderBook).join("");
  } catch (error) {
    console.error("❌ Lỗi tải sách mới:", error);
    const newBooksContainer = document.querySelector(".new-books__book-list");
    if (newBooksContainer) {
      newBooksContainer.innerHTML = "<p>Lỗi tải sách mới</p>";
    }
  }
}

// Hàm countdown timer Flash Sale
function startTimer() {
  const timerElement = document.querySelector(".flash-sale__time");
  if (!timerElement) {
    console.error("Không tìm thấy .flash-sale__time trong HTML");
    return;
  }

  let timeLeft = 54 * 60 + 11; // 54 phút 11 giây
  setInterval(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${String(hours).padStart(2, "0")} : ${String(
      minutes
    ).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`;
    timeLeft--;
    if (timeLeft < 0) timeLeft = 54 * 60 + 11;
  }, 1000);
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

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  await fetchCategories();
  await fetchFlashSaleBooks();
  await fetchFeaturedBooks();
  await fetchNewBooks();
  startTimer();
  handleSearch();
});
