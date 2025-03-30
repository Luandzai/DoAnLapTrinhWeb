// Manage-coupon-codes.js
const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", function () {
  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const adminId = user?.userId;

  // Kiểm tra quyền truy cập
  if (!user || user.role !== "Admin") {
    alert("Bạn không có quyền truy cập trang này! Chuyển hướng về trang chủ.");
    window.location.href = "../html/index.html";
    return;
  }

  const discountTableBody = document.querySelector("#discount-table tbody");
  const discountForm = document.getElementById("discount-form");
  const discountModal = document.getElementById("discount-modal");
  let discountsData = [];

  // Hàm lấy danh sách mã giảm giá
  async function fetchDiscounts() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/discounts?adminId=${adminId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (
        result.success &&
        result.value &&
        Array.isArray(result.value.$values)
      ) {
        discountsData = result.value.$values;
        renderDiscounts(discountsData);
      } else {
        console.error("Dữ liệu không hợp lệ:", result);
        alert(result.message || "Không lấy được danh sách mã giảm giá.");
        renderDiscounts([]);
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
      alert("Có lỗi xảy ra khi tải danh sách mã giảm giá.");
      renderDiscounts([]);
    }
  }

  // Hàm hiển thị danh sách mã giảm giá
  function renderDiscounts(discounts) {
    if (!discountTableBody) {
      console.error("Không tìm thấy discount-table tbody trong HTML");
      return;
    }

    if (!discounts.length) {
      discountTableBody.innerHTML =
        "<tr><td colspan='9'>Không có mã giảm giá nào.</td></tr>";
      return;
    }

    discountTableBody.innerHTML = discounts
      .map(
        (discount) => `
                <tr>
                    <td>${discount.discountId}</td>
                    <td>${discount.code}</td>
                    <td>${discount.discountAmount.toLocaleString(
                      "vi-VN"
                    )} VNĐ</td>
                    <td>${new Date(discount.startDate).toLocaleDateString(
                      "vi-VN"
                    )}</td>
                    <td>${new Date(discount.endDate).toLocaleDateString(
                      "vi-VN"
                    )}</td>
                    <td>${discount.usageLimit || "Không giới hạn"}</td>
                    <td>${discount.usedCount}</td>
                    <td>${discount.assignedCount}</td>
                    <td>
                        <button class="edit-btn" data-id="${
                          discount.discountId
                        }">Sửa</button>
                        <button class="delete-btn" data-id="${
                          discount.discountId
                        }">Xóa</button>
                    </td>
                </tr>
            `
      )
      .join("");

    // Gắn sự kiện cho các nút
    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", handleEditDiscount);
    });
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleDeleteDiscount);
    });
  }

  // Hàm hiển thị form thêm/sửa mã giảm giá
  function showDiscountModal(discount = null) {
    discountModal.style.display = "flex";
    discountForm.dataset.discountId = discount ? discount.discountId : "";
    document.getElementById("code").value = discount ? discount.code : "";
    document.getElementById("discountAmount").value = discount
      ? discount.discountAmount
      : "";
    document.getElementById("startDate").value = discount
      ? discount.startDate.slice(0, 16)
      : "";
    document.getElementById("endDate").value = discount
      ? discount.endDate.slice(0, 16)
      : "";
    document.getElementById("usageLimit").value = discount
      ? discount.usageLimit || ""
      : "";
    document.getElementById("form-title").textContent = discount
      ? "Sửa Mã Giảm Giá"
      : "Thêm Mã Giảm Giá";
  }

  // Hàm ẩn modal
  function hideModal() {
    discountModal.style.display = "none";
    discountForm.reset();
    delete discountForm.dataset.discountId;
  }

  // Hàm xử lý submit form
  async function handleDiscountFormSubmit(event) {
    event.preventDefault();
    const discountId = discountForm.dataset.discountId;
    const formData = {
      code: document.getElementById("code").value,
      discountAmount: parseFloat(
        document.getElementById("discountAmount").value
      ),
      startDate: new Date(
        document.getElementById("startDate").value
      ).toISOString(),
      endDate: new Date(document.getElementById("endDate").value).toISOString(),
      usageLimit: document.getElementById("usageLimit").value
        ? parseInt(document.getElementById("usageLimit").value)
        : null,
    };

    try {
      const method = discountId ? "PUT" : "POST";
      const url = discountId
        ? `${API_BASE_URL}/admin/discounts/${discountId}?adminId=${adminId}`
        : `${API_BASE_URL}/admin/discounts?adminId=${adminId}`;

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        hideModal();
        fetchDiscounts();
      } else {
        alert(result.message || "Lỗi khi lưu mã giảm giá.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Có lỗi xảy ra khi lưu mã giảm giá.");
    }
  }

  // Hàm xử lý sửa mã giảm giá
  function handleEditDiscount(event) {
    const discountId = event.target.dataset.id;
    const discount = discountsData.find((d) => d.discountId == discountId);
    if (discount) showDiscountModal(discount);
  }

  // Hàm xóa mã giảm giá
  async function handleDeleteDiscount(event) {
    const discountId = event.target.dataset.id;
    if (!confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/discounts/${discountId}?adminId=${adminId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchDiscounts();
      } else {
        alert(result.message || "Lỗi khi xóa mã giảm giá.");
      }
    } catch (error) {
      console.error("Error deleting discount:", error);
      alert("Có lỗi xảy ra khi xóa mã giảm giá.");
    }
  }

  // Gắn sự kiện
  document
    .getElementById("add-discount-btn")
    ?.addEventListener("click", () => showDiscountModal());
  discountForm?.addEventListener("submit", handleDiscountFormSubmit);
  document
    .getElementById("cancel-discount-btn")
    ?.addEventListener("click", hideModal);

  // Tải danh sách khi trang load
  fetchDiscounts();
});

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

// Khởi chạy khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  await fetchCategories();
  handleSearch();
  renderLoginSection(); // Thêm chức năng render login
});
