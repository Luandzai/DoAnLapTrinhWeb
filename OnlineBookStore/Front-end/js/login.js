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
      alert("Đăng ký thành công! Bạn đã được đăng nhập tự động.");
      window.location.href = "../html/index.html";
    } else {
      alert(result.message || "Đăng ký thất bại!");
    }
  } catch (error) {
    console.error("Error registering:", error);
    alert("Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
  }
}

// Hàm xử lý đăng nhập (cập nhật lại)
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
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: result.userId,
          fullName: result.fullName,
          role: result.role,
        })
      );
      alert("Đăng nhập thành công!");
      window.location.href = "../html/index.html";
    } else {
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

// Gắn sự kiện cho form đăng ký
document
  .querySelector(".sign-up-container form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.querySelector(
      ".sign-up-container input[placeholder='Name']"
    ).value;
    const email = document.querySelector(
      ".sign-up-container input[placeholder='Email']"
    ).value;
    const password = document.querySelector(
      ".sign-up-container input[placeholder='Password']"
    ).value;
    await register(fullName, email, password);
  });


