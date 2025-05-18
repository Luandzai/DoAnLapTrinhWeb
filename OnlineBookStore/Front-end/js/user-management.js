const API_BASE_URL = "http://localhost:5000/api";

// Biến toàn cục để lưu danh sách người dùng gốc
let allUsers = [];

// Hàm lấy danh sách người dùng
async function loadUsers(adminId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users?userId=${adminId}`
    );
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const result = await response.json();
    console.log("Dữ liệu người dùng từ API:", result);

    if (result.success && result.value && Array.isArray(result.value.$values)) {
      allUsers = result.value.$values; // Lưu danh sách gốc
      renderUsers(allUsers); // Hiển thị toàn bộ danh sách ban đầu
    } else {
      console.error("Dữ liệu không hợp lệ hoặc không có người dùng:", result);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Không lấy được danh sách người dùng.",
      });
      renderUsers([]);
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
    renderUsers([]);
  }
}

// Hàm render danh sách người dùng
function renderUsers(users) {
  const userList = document.getElementById("user-list");
  if (!userList) {
    console.error("Không tìm thấy user-list trong HTML");
    return;
  }

  if (!users.length) {
    userList.innerHTML =
      "<tr><td colspan='7'>Không có người dùng nào.</td></tr>";
    return;
  }

  userList.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td>${user.userId}</td>
          <td>${user.fullName}</td>
          <td>${user.email}</td>
          <td>${user.phoneNumber || "Chưa cập nhật"}</td>
          <td>${user.address || "Chưa cập nhật"}</td>
          <td>${user.role}</td>
          <td>
            <button class="btn-edit" onclick="showEditUserModal(${
              user.userId
            })">Sửa</button>
            <button class="btn-delete" onclick="deleteUser(${
              user.userId
            })">Xóa</button>
          </td>
        </tr>
      `
    )
    .join("");
}

// Hàm hiển thị modal chỉnh sửa người dùng
async function showEditUserModal(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    const result = await response.json();
    if (!result.success) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Không tìm thấy người dùng.",
      });
      return;
    }

    const user = result.data;
    const modal = document.getElementById("user-modal");
    const form = document.getElementById("user-form");

    form.dataset.userId = userId;
    document.getElementById("fullName").value = user.fullName;
    document.getElementById("email").value = user.email;
    document.getElementById("phoneNumber").value = user.phoneNumber || "";
    document.getElementById("address").value = user.address || "";
    document.getElementById("role").value = user.role;

    modal.style.display = "flex";
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Hàm ẩn modal
function hideModal() {
  document.getElementById("user-modal").style.display = "none";
}

// Hàm xử lý submit form chỉnh sửa người dùng
async function handleUserFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const userId = form.dataset.userId;
  const admin = JSON.parse(localStorage.getItem("user"));
  const formData = {
    fullName: form.fullName.value,
    email: form.email.value,
    phoneNumber: form.phoneNumber.value,
    address: form.address.value,
    role: form.role.value,
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}?adminId=${admin.userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );
    const result = await response.json();
    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật người dùng thành công!",
      });
      hideModal();
      await loadUsers(admin.userId); // Tải lại danh sách sau khi cập nhật
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Lỗi khi cập nhật người dùng.",
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Hàm xóa người dùng
async function deleteUser(userId) {
  const confirmation = await Swal.fire({
    icon: "warning",
    title: "Xác nhận xóa",
    text: "Bạn có chắc muốn xóa người dùng này?",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  });

  if (!confirmation.isConfirmed) return;

  try {
    const admin = JSON.parse(localStorage.getItem("user"));
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}?adminId=${admin.userId}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();
    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Xóa người dùng thành công!",
      });
      await loadUsers(admin.userId); // Tải lại danh sách sau khi xóa
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Lỗi khi xóa người dùng.",
      });
    }
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Hàm xử lý tìm kiếm người dùng
function handleUserSearch() {
  const searchInput = document.getElementById("search-user");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    const filteredUsers = allUsers.filter(
      (user) =>
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        (user.phoneNumber &&
          user.phoneNumber.toLowerCase().includes(keyword)) ||
        (user.address && user.address.toLowerCase().includes(keyword))
    );
    renderUsers(filteredUsers);
  });
}

// Các hàm chung
function handleSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

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

// Hàm render phần đăng nhập
function renderLoginSection() {
  const loginSection = document.getElementById("login-section");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!loginSection) return;

  if (!user) {
    loginSection.innerHTML = `
      <button class="login__dropdown-btn">
        <img src="../img/Login.svg" alt="Đăng nhập" />
      </button>
      <div class="login__dropdown-content">
        <a href="./Login.html">Đăng Nhập</a>
      </div>
    `;
  } else {
    loginSection.innerHTML = `
      <div class="login__user">
        <img src="../img/login.svg" alt="Avatar" />
        <span>${user.fullName}</span>
      </div>
      <div class="login__dropdown-content">
        <a href="../html/Admin.html">Quản lý</a>
        <a href="#" id="logout-btn">Đăng xuất</a>
      </div>
    `;
    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.reload();
    });
  }
}

// Khởi tạo khi trang tải
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "Admin") {
    Swal.fire({
      icon: "error",
      title: "Truy cập bị từ chối",
      text: "Bạn không có quyền truy cập trang này! Chuyển hướng về trang chủ.",
    }).then(() => {
      window.location.href = "../html/index.html";
    });
    return;
  }

  loadUsers(user.userId); // Truyền adminId từ localStorage
  handleSearch(); // Tìm kiếm sách
  handleUserSearch(); // Tìm kiếm người dùng
  fetchCategories();
  renderLoginSection();

  document
    .getElementById("user-form")
    ?.addEventListener("submit", handleUserFormSubmit);
  document
    .getElementById("cancel-user-btn")
    ?.addEventListener("click", hideModal);
});
