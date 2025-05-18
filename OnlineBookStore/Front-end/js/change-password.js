const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.userId) {
    Swal.fire({
      icon: "warning",
      title: "Cảnh báo",
      text: "Bạn chưa đăng nhập! Chuyển hướng về trang đăng nhập.",
    });
    window.location.href = "./Login.html";
    return;
  }

  document
    .getElementById("change-password-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault(); // Ngăn chặn tải lại trang

      const oldPassword = document.getElementById("old-password").value.trim();
      const newPassword = document.getElementById("new-password").value.trim();
      const confirmPassword = document
        .getElementById("confirm-password")
        .value.trim();

      if (!oldPassword || !newPassword || !confirmPassword) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo",
          text: "Vui lòng nhập đầy đủ thông tin!",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Mật khẩu mới và xác nhận mật khẩu không khớp!",
        });
        return;
      }

      await changePassword(user.userId, oldPassword, newPassword);
    });
});

// Hàm gửi yêu cầu đổi mật khẩu
async function changePassword(userId, oldPassword, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/Users/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        oldPassword: oldPassword,
        newPassword: newPassword,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đổi mật khẩu thành công!",
      });
      window.location.href = "./Login.html";
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Đổi mật khẩu thất bại.",
      });
    }
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
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
  await fetchCategories();
  handleSearch();
  renderLoginSection(); // Thêm chức năng render login
});
