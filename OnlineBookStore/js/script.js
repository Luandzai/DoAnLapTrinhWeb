// Dữ liệu sách
const booklist = [
  {
    img: "../img/truyen1.jpg",
    name: "Take Note!",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen2.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen3.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen4.jpg",
    name: "TakeNote!-Loremipsum,dolorsitametconsecteturadipisicing elit.Blanditiis,velit.KiếnThứcTrọngTâmLớp10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen16.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen18.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen5.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen6.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen7.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen8.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen9.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen10.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen13.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen20.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen15.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
  {
    img: "../img/truyen16.jpg",
    name: "Take Note! - Kiến Thức Trọng Tâm Lớp 10",
    price: "10.000 đ",
    oldPrice: "55.000 đ",
    discount: "-81%",
    sold: 5,
  },
];

// Hàm render sách với tham số limit
function renderBooks(containerId, books, limit = books.length) {
  const container = document.querySelector(`#${containerId} .book-list`);
  container.innerHTML = ""; // Xóa nội dung cũ
  const limitedBooks = books.slice(0, limit); // Lấy số lượng sách giới hạn
  limitedBooks.forEach((book) => {
    const bookItem = `
      <div class="book-item">
        <a href="../html/book-detail.html"><img src="${book.img}" alt="Book Cover" /></a>
        <h3 class="book-name">${book.name}</h3>
        <div class="Gia">
          <span class="GiaHienTai">${book.price}</span>
          <span class="discount">${book.discount}</span>
        </div>
        <span class="GiaCu">${book.oldPrice}</span>
        <div class="DaBan">Đã bán ${book.sold}</div>
      </div>
    `;
    container.innerHTML += bookItem;
  });
}

// Gọi hàm render cho từng section
document.addEventListener("DOMContentLoaded", () => {
  renderBooks("flash-sale", booklist, 4);
  renderBooks("featured-books", booklist, 4);
  renderBooks("new-books", booklist, 8);
});

// Timer cho Flash Sale
function startTimer() {
  let timeLeft = 54 * 60 + 11; // 54 phút 11 giây (tính bằng giây)
  const timerElement = document.querySelector(".time");

  const countdown = setInterval(() => {
    let hours = Math.floor(timeLeft / 3600);
    let minutes = Math.floor((timeLeft % 3600) / 60);
    let seconds = timeLeft % 60;

    // Định dạng thời gian
    timerElement.textContent = `${hours.toString().padStart(2, "0")} : ${minutes
      .toString()
      .padStart(2, "0")} : ${seconds.toString().padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      timerElement.textContent = "Hết giờ!";
    } else {
      timeLeft--;
    }
  }, 1000); // Cập nhật mỗi giây
}

// Khởi động timer khi trang tải
document.addEventListener("DOMContentLoaded", startTimer);
