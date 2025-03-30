// manage-reviews.js
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

  const reviewTableBody = document.querySelector("#review-table tbody");
  const searchInput = document.querySelector("#search-review");
  let reviewsData = [];

  // Hàm lấy danh sách đánh giá
  async function fetchReviews(search = "", bookId = "", rating = "") {
    try {
      let url = `${API_BASE_URL}/admin/reviews?adminId=${adminId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (bookId) url += `&bookId=${bookId}`;
      if (rating) url += `&rating=${rating}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (
        result.success &&
        result.value &&
        Array.isArray(result.value.$values)
      ) {
        reviewsData = result.value.$values; // Lấy mảng từ result.value.$values
        renderReviews(reviewsData);
      } else {
        console.error("Dữ liệu không hợp lệ hoặc không có đánh giá:", result);
        alert(result.message || "Không lấy được danh sách đánh giá.");
        renderReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      alert("Có lỗi xảy ra khi tải danh sách đánh giá.");
      renderReviews([]);
    }
  }

  // Hàm hiển thị danh sách đánh giá lên bảng
  function renderReviews(reviews) {
    if (!reviewTableBody) {
      console.error("Không tìm thấy review-table tbody trong HTML");
      return;
    }

    if (!reviews.length) {
      reviewTableBody.innerHTML =
        "<tr><td colspan='7'>Không có đánh giá nào.</td></tr>";
      return;
    }

    reviewTableBody.innerHTML = reviews
      .map(
        (review) => `
                <tr>
                    <td>${review.reviewId}</td>
                    <td>${review.bookTitle}</td>
                    <td>${review.userName}</td>
                    <td>${review.rating}</td>
                    <td>${review.comment}</td>
                    <td>${new Date(review.createdAt).toLocaleString()}</td>
                    <td>
                        <button class="delete-btn" data-id="${
                          review.reviewId
                        }">Xóa</button>
                    </td>
                </tr>
            `
      )
      .join("");

    // Gắn sự kiện cho các nút xóa
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleDeleteReview);
    });
  }

  // Hàm xóa đánh giá
  async function handleDeleteReview(event) {
    const reviewId = event.target.dataset.id;
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/reviews/${reviewId}?adminId=${adminId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchReviews(searchInput?.value || ""); // Tải lại danh sách sau khi xóa
      } else {
        alert(result.message || "Lỗi khi xóa đánh giá.");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Có lỗi xảy ra khi xóa đánh giá.");
    }
  }

  // Xử lý tìm kiếm
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.trim();
      fetchReviews(searchTerm);
    });
  }

  // Tải danh sách đánh giá khi trang được load
  fetchReviews();
});

// Hàm để làm mới danh sách (có thể gọi từ nơi khác nếu cần)
function refreshReviews() {
  const searchInput = document.querySelector("#search-review");
  fetchReviews(searchInput ? searchInput.value : "");
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
