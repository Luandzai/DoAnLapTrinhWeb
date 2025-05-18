const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const revenueTableBody = document.querySelector("#revenue-table tbody");
  const totalRevenueElement = document.querySelector(".total-revenue");
  const filterForm = document.getElementById("filter-form");

  // Kiểm tra quyền truy cập admin
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

  // Hàm render bảng doanh thu
  function renderRevenueTable(orders) {
    console.log("Dữ liệu đơn hàng từ API:", orders);
    if (!Array.isArray(orders) || orders.length === 0) {
      revenueTableBody.innerHTML = `<tr><td colspan="4">Không có dữ liệu</td></tr>`;
      return;
    }
    revenueTableBody.innerHTML = "";
    orders.forEach((order) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.orderId}</td>
        <td>${order.customerName}</td>
        <td>${Number(order.totalPrice).toLocaleString()} VNĐ</td>
        <td>${formatDate(order.orderDate)}</td>
      `;
      revenueTableBody.appendChild(row);
    });
  }

  // Hàm định dạng ngày
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN");
  }

  // Hàm lấy dữ liệu doanh thu từ API
  async function fetchRevenueData(startDate, endDate) {
    try {
      const url = new URL(`${API_BASE_URL}/Revenue/filter`);
      if (startDate) url.searchParams.append("startDate", startDate);
      if (endDate) url.searchParams.append("endDate", endDate);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();

      // Lấy đúng mảng đơn hàng từ result.orders.$values hoặc result.orders
      let ordersArr = [];
      if (result.success && result.orders) {
        if (Array.isArray(result.orders)) {
          ordersArr = result.orders;
        } else if (
          result.orders.$values &&
          Array.isArray(result.orders.$values)
        ) {
          ordersArr = result.orders.$values;
        }
        renderRevenueTable(ordersArr);
        totalRevenueElement.textContent = `Tổng doanh thu: ${Number(
          result.totalRevenue
        ).toLocaleString()} VNĐ`;
      } else {
        renderRevenueTable([]);
        totalRevenueElement.textContent = `Tổng doanh thu: 0 VNĐ`;
        Swal.fire({
          icon: "info",
          title: "Thông báo",
          text: result.message || "Không có dữ liệu doanh thu.",
        });
      }
    } catch (error) {
      renderRevenueTable([]);
      totalRevenueElement.textContent = `Tổng doanh thu: 0 VNĐ`;
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: `Đã xảy ra lỗi khi lấy dữ liệu doanh thu: ${error.message}`,
      });
    }
  }

  // Xử lý sự kiện lọc
  filterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (!startDate || !endDate) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.",
      });
      return;
    }
    await fetchRevenueData(startDate, endDate);
  });

  // Đặt mặc định ngày bắt đầu và kết thúc là rỗng, tổng doanh thu là 0
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  renderRevenueTable([]);
  totalRevenueElement.textContent = "Tổng doanh thu: 0 VNĐ";
});
// Không cần sửa gì thêm, code đã đúng.
