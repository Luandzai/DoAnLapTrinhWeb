document
  .getElementById("change-password-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        alert("Bạn cần đăng nhập để thực hiện chức năng này.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/users/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.userId,
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert("Đổi mật khẩu thành công!");
        window.location.href = "../html/user.html";
      } else {
        alert(result.message || "Đổi mật khẩu thất bại!");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  });
