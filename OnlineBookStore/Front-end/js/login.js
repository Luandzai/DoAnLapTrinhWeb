// Hàm xử lý đăng ký
async function register(fullName, email, password) {
  try {
    const response = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: fullName,
        email: email,
        password: password,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: result.userId,
          fullName: result.fullName,
          role: result.role,
        })
      );
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đăng ký thành công! Bạn đã được đăng nhập tự động.",
      }).then(() => {
        window.location.href = "../html/index.html";
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Đăng ký thất bại!",
      });
    }
  } catch (error) {
    console.error("Error registering:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Hàm xử lý đăng nhập
async function login(email, password) {
  try {
    const response = await fetch("http://localhost:5000/api/account/login", { // Sửa endpoint
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const result = await response.json();
    console.log(result);

    if (response.ok) {
      // Lưu cả token và thông tin user
      localStorage.setItem('token', result.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: result.user.id,
          fullName: result.user.fullName,
          role: result.user.role,
        })
      );

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đăng nhập thành công!",
      }).then(() => {
        if (result.user.role === "Admin") {
          window.location.href = "../html/Admin.html";
        } else {
          window.location.href = "../html/index.html";
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: result.message || "Đăng nhập thất bại.",
      });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    Swal.fire({
      icon: "error", 
      title: "Lỗi",
      text: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
}

// Hàm xử lý đăng xuất
function handleLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token"); // Xóa token
  window.location.href = "../html/Login.html";
}

// Gắn sự kiện cho form đăng nhập
document
  .getElementById("sign-in-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("sign-in-email").value;
    const password = document.getElementById("sign-in-password").value;
    await login(email, password);
  });

// Gắn sự kiện cho form đăng ký
document
  .getElementById("sign-up-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.querySelector(
      "#sign-up-form input[placeholder='Name']"
    ).value;
    const email = document.querySelector(
      "#sign-up-form input[placeholder='Email']"
    ).value;
    const password = document.querySelector(
      "#sign-up-form input[placeholder='Password']"
    ).value;
    await register(fullName, email, password);
  });
