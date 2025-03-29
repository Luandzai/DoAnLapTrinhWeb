// Hàm xử lý đăng nhập
async function login(email, password) {
  try {
    const response = await fetch("http://localhost:5000/api/users/login", {
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

    if (response.ok) {
      // Lưu toàn bộ thông tin user vào localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: result.userId,
          fullName: result.fullName,
          role: result.role,
        })
      );
      alert("Đăng nhập thành công!");
      window.location.href = "../html/index.html"; // Chuyển hướng đến index.html
    } else {
      // Xử lý lỗi từ backend hoặc fallback
      alert(result.message || "Email hoặc mật khẩu không đúng!");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    alert("Đã có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.");
  }
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

// Hàm xử lý đăng ký tài khoản
async function register(name, email, password) {
  try {
    console.log("Registering user:", { name, email, password }); // Log dữ liệu gửi đi
    const response = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: name,
        email: email,
        password: password,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      document
        .getElementById("container")
        .classList.remove("right-panel-active");
    } else {
      console.error("Registration error:", result.message);
      alert(result.message || "Đăng ký thất bại!");
    }
  } catch (error) {
    console.error("Error registering:", error);
    alert("Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
  }
}

// Gắn sự kiện cho form đăng ký
document
  .getElementById("sign-up-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("sign-up-name").value;
    const email = document.getElementById("sign-up-email").value;
    const password = document.getElementById("sign-up-password").value;
    await register(name, email, password);
  });
