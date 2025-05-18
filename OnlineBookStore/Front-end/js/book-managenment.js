const API_BASE_URL = "http://localhost:5000/api"; // Cập nhật URL API đúng với backend của bạn

// Thêm biến lưu danh sách sách gốc để lọc tìm kiếm
let allBooks = [];

async function loadBooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/books`);
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const result = await response.json();
    if (result.success && result.value && Array.isArray(result.value.$values)) {
      allBooks = result.value.$values; // Lưu danh sách gốc
      renderBooks(allBooks);
    } else {
      console.error("Dữ liệu không hợp lệ:", result);
      allBooks = [];
      renderBooks([]);
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sách:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
    allBooks = [];
    renderBooks([]);
  }
}

function renderBooks(books) {
  const bookList = document.getElementById("book-list");
  if (!bookList) {
    console.error("Không tìm thấy book-list trong HTML");
    return;
  }

  if (!Array.isArray(books) || books.length === 0) {
    bookList.innerHTML = "<tr><td colspan='9'>Không có sách nào.</td></tr>";
    return;
  }

  bookList.innerHTML = books
    .map((book) => {
      return `
          <tr>
            <td>${book.bookId}</td>
            <td>${book.title}</td>
            <td>${book.authorName}</td>
            <td>${book.publisherName}</td>
            <td>${book.categoryName}</td>
            <td>${
              book.discountPrice
                ? book.discountPrice.toLocaleString()
                : book.price.toLocaleString()
            }đ</td>
            <td>${book.stockQuantity}</td>
            <td>${book.discountPrice ? "Có" : "Không"}</td>
            <td>
              <button class="btn-edit" onclick="showEditBookModal(${
                book.bookId
              })">Sửa</button>
              <button class="btn-delete" onclick="deleteBook(${
                book.bookId
              })">Xóa</button>
            </td>
          </tr>
        `;
    })
    .join("");
}

// --- Thêm hàm xử lý tìm kiếm sách ---
function handleBookSearch() {
  const searchInput = document.getElementById("search-book");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    const filteredBooks = allBooks.filter(
      (book) =>
        (book.title && book.title.toLowerCase().includes(keyword)) ||
        (book.authorName && book.authorName.toLowerCase().includes(keyword)) ||
        (book.publisherName &&
          book.publisherName.toLowerCase().includes(keyword)) ||
        (book.categoryName && book.categoryName.toLowerCase().includes(keyword))
    );
    renderBooks(filteredBooks);
  });
}

async function loadDropdowns() {
  try {
    const authorsResponse = await fetch(`${API_BASE_URL}/admin/books/authors`);
    const authorsResult = await authorsResponse.json();
    if (
      authorsResult.success &&
      authorsResult.value &&
      Array.isArray(authorsResult.value.$values)
    ) {
      const authorSelect = document.getElementById("authorId");
      authorSelect.innerHTML = authorsResult.value.$values
        .map(
          (author) =>
            `<option value="${author.authorId}">${author.authorName}</option>`
        )
        .join("");
    }

    const publishersResponse = await fetch(
      `${API_BASE_URL}/admin/books/publishers`
    );
    const publishersResult = await publishersResponse.json();
    if (
      publishersResult.success &&
      publishersResult.value &&
      Array.isArray(publishersResult.value.$values)
    ) {
      const publisherSelect = document.getElementById("publisherId");
      publisherSelect.innerHTML = publishersResult.value.$values
        .map(
          (publisher) =>
            `<option value="${publisher.publisherId}">${publisher.publisherName}</option>`
        )
        .join("");
    }

    const categoriesResponse = await fetch(
      `${API_BASE_URL}/admin/books/categories`
    );
    const categoriesResult = await categoriesResponse.json();
    if (
      categoriesResult.success &&
      categoriesResult.value &&
      Array.isArray(categoriesResult.value.$values)
    ) {
      const categorySelect = document.getElementById("categoryId");
      categorySelect.innerHTML = categoriesResult.value.$values
        .map(
          (category) =>
            `<option value="${category.categoryId}">${category.categoryName}</option>`
        )
        .join("");
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu dropdown:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không thể tải dữ liệu dropdown, vui lòng thử lại sau.",
    });
  }
}

function showAddBookModal() {
  const modal = document.getElementById("book-modal");
  const form = document.getElementById("book-form");
  const title = document.getElementById("modal-title");

  title.textContent = "Thêm sách mới";
  form.reset();
  form.dataset.bookId = "";
  modal.style.display = "flex";
}

// Hàm kiểm tra sách đã từng được mua bởi Customer chưa
async function isBookPurchasedByCustomer(bookId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/books/${bookId}/is-purchased`
    );
    if (!response.ok) return false;
    const result = await response.json();
    return result.success && result.purchased === true;
  } catch (error) {
    console.error("Lỗi kiểm tra sách đã mua:", error);
    return false;
  }
}

// Sửa hàm showEditBookModal để chặn mở form nếu không được phép sửa
async function showEditBookModal(bookId) {
  // Kiểm tra sách đã từng được mua bởi Customer chưa
  const purchased = await isBookPurchasedByCustomer(bookId);
  if (purchased) {
    Swal.fire({
      icon: "warning",
      title: "Không thể chỉnh sửa",
      text: "Sách này đang thuộc một đơn hàng ở trạng thái 'Chờ xác nhận'.",
    });
    return;
  }
  // Nếu không bị chặn thì mới mở form sửa
  try {
    const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`);
    const result = await response.json();
    if (!result.success) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Không tìm thấy sách.",
      });
      return;
    }

    const book = result.value;
    const modal = document.getElementById("book-modal");
    const form = document.getElementById("book-form");
    const title = document.getElementById("modal-title");

    title.textContent = "Chỉnh sửa sách";
    form.dataset.bookId = bookId;

    document.getElementById("title").value = book.title;
    document.getElementById("authorId").value = book.authorId;
    document.getElementById("publisherId").value = book.publisherId;
    document.getElementById("categoryId").value = book.categoryId;
    document.getElementById("price").value = book.price;
    document.getElementById("oldPrice").value = book.oldPrice;
    document.getElementById("discountPrice").value = book.discountPrice || "";
    document.getElementById("stockQuantity").value = book.stockQuantity;
    document.getElementById("isbn").value = book.isbn;
    document.getElementById("publishedDate").value = book.publishedDate
      ? book.publishedDate.split("T")[0]
      : "";
    document.getElementById("description").value = book.description || "";
    document.getElementById("coverImage").value = "";

    modal.style.display = "flex";
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sách:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

function hideModal() {
  document.getElementById("book-modal").style.display = "none";
}

async function handleBookFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const bookId = form.dataset.bookId;
  const formData = new FormData(form);

  try {
    const url = bookId
      ? `${API_BASE_URL}/admin/books/${bookId}`
      : `${API_BASE_URL}/admin/books`;
    const method = bookId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      await Swal.fire({
        icon: "success",
        title: "Thành công",
        text: bookId ? "Cập nhật sách thành công!" : "Thêm sách thành công!",
      });
      hideModal();
      await loadBooks();
    } else {
      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Lỗi khi xử lý sách.",
        showConfirmButton: true,
        allowOutsideClick: false,
      });
    }
  } catch (error) {
    console.error("Lỗi khi gửi form:", error);
    await Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
      showConfirmButton: true,
      allowOutsideClick: false,
    });
  }
}

async function deleteBook(bookId) {
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
        showConfirmButton: true,
        allowOutsideClick: false,
      });
    }
  } catch (error) {
    console.error("Lỗi khi xóa sách:", error);
    await Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
      showConfirmButton: true,
      allowOutsideClick: false,
    });
  }
}

// Thêm tác giả mới
function showAddAuthorModal() {
  const modal = document.getElementById("author-modal");
  const form = document.getElementById("author-form");
  form.reset();
  modal.style.display = "flex";
}

function hideAuthorModal() {
  document.getElementById("author-modal").style.display = "none";
}

async function handleAuthorFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const user = JSON.parse(localStorage.getItem("user"));
  const adminId = user.userId;

  const authorData = {
    authorName: document.getElementById("authorName").value,
    bio: document.getElementById("authorBio").value || null,
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/authors?adminId=${adminId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authorData),
      }
    );

    const result = await response.json();
    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: result.message,
      });
      hideAuthorModal();
      await loadDropdowns(); // Cập nhật lại dropdown tác giả
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Lỗi khi thêm tác giả.",
      });
    }
  } catch (error) {
    console.error("Lỗi khi thêm tác giả:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
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

// Hàm render phần login dựa trên trạng thái đăng nhập
function renderLoginSection() {
  const loginSection = document.getElementById("login-section");
  const user = JSON.parse(localStorage.getItem("user")); // Lấy thông tin user từ localStorage

  if (!loginSection) {
    console.error("Không tìm thấy login-section trong HTML");
    return;
  }

  if (!user) {
    // Chưa đăng nhập
    loginSection.innerHTML = `
          <button class="login__dropdown-btn">
            <img src="../img/Login.svg" alt="Đăng nhập" />
          </button>
          <div class="login__dropdown-content">
            <a href="./Login.html">Đăng Nhập</a>
          </div>
        `;
  } else {
    // Đã đăng nhập
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

    // Xử lý đăng xuất
    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user"); // Xóa thông tin user
      window.location.reload(); // Tải lại trang
    });
  }
}

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "Admin") {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Bạn không có quyền truy cập trang này! Chuyển hướng về trang chủ.",
    });
    window.location.href = "../html/index.html";
    return;
  }
  await fetchCategories();
  handleSearch();
  renderLoginSection();

  await loadBooks();
  await loadDropdowns();

  document
    .getElementById("add-book-btn")
    .addEventListener("click", showAddBookModal);
  document
    .getElementById("book-form")
    .addEventListener("submit", handleBookFormSubmit);
  document
    .getElementById("cancel-book-btn")
    .addEventListener("click", hideModal);
  document
    .getElementById("add-author-btn")
    .addEventListener("click", showAddAuthorModal);
  document
    .getElementById("author-form")
    .addEventListener("submit", handleAuthorFormSubmit);
  document
    .getElementById("cancel-author-btn")
    .addEventListener("click", hideAuthorModal);

  // Thêm gọi hàm tìm kiếm sách
  handleBookSearch();
});
