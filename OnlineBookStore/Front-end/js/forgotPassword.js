function sendResetToken() {
  const email = document.getElementById("email").value; // Lấy email từ input

  if (!email) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Email không được để trống!",
    });
    return;
  }

  fetch("http://localhost:5000/api/Account/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: data.message || "Mã đặt lại mật khẩu đã được gửi.",
      });
    })
    .catch((error) => {
      console.error("Lỗi:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra, vui lòng thử lại.",
      });
    });
}

function resetPassword() {
  const token = document.getElementById("token").value;
  const newPassword = document.getElementById("newPassword").value;

  if (!token || !newPassword) {
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Vui lòng nhập token và mật khẩu mới!",
    });
    return;
  }

  fetch("http://localhost:5000/api/Account/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, newPassword: newPassword }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: data.message || "Mật khẩu đã được đặt lại thành công.",
      }).then(() => {
        window.location.href = "login.html"; // Chuyển hướng sau khi đổi mật khẩu thành công
      });
    })
    .catch((error) => {
      console.error("Lỗi:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra, vui lòng thử lại.",
      });
    });
}
