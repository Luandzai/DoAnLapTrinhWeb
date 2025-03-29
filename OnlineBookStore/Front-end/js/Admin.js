// Function to show the selected section
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => {
    section.style.display = "none";
  });

  // Show the selected section
  const activeSection = document.getElementById(sectionId);
  activeSection.style.display = "block";
}

// Function to show add user form
function showAddUserForm() {
  document.getElementById("addUserModal").style.display = "flex";
}

// Function to close add user form
function closeAddUserForm() {
  document.getElementById("addUserModal").style.display = "none";
}

// Handle form submit (example of adding user)
document
  .getElementById("addUserForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    // Lấy thông tin người dùng từ form
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const role = document.getElementById("role").value;

    // Tạo dòng mới trong bảng người dùng
    const table = document
      .getElementById("user-table")
      .getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();

    // Tạo các ô dữ liệu
    newRow.innerHTML = `
        <td>#</td>
        <td>${name}</td>
        <td>${email}</td>
        <td>${role}</td>
        <td><button class="edit-btn">Edit</button> <button class="delete-btn">Delete</button></td>
    `;

    // Đóng form sau khi thêm thành công
    closeAddUserForm();
  });

// Function to fetch and display users in the table
async function fetchAndDisplayUsers() {
  try {
    const response = await fetch("http://localhost:5000/api/users");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users = await response.json();

    const tableBody = document
      .getElementById("user-table")
      .getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Clear existing rows

    users.forEach((user, index) => {
      const newRow = tableBody.insertRow();
      newRow.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.fullName}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>
          <button class="edit-btn" onclick="editUser(${
            user.userId
          })">Edit</button>
          <button class="delete-btn" onclick="deleteUser(${
            user.userId
          })">Delete</button>
        </td>
      `;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Call fetchAndDisplayUsers when the page loads
document.addEventListener("DOMContentLoaded", fetchAndDisplayUsers);

// Function to edit a user (placeholder)
function editUser(userId) {
  alert(`Edit user with ID: ${userId}`);
}

// Function to delete a user (placeholder)
function deleteUser(userId) {
  alert(`Delete user with ID: ${userId}`);
}

// Function to fetch and display books in the table
async function fetchAndDisplayBooks() {
  try {
    const response = await fetch("http://localhost:5000/api/Books");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const books = await response.json();
    const tableBody = document
      .getElementById("product-table")
      .getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Clear existing rows

    books.forEach((book) => {
      const newRow = tableBody.insertRow();
      newRow.innerHTML = `
        <td>${book.title}</td>
        <td>${book.categoryId}</td>
        <td>${book.price}</td>
        <td>${book.soldQuantity}</td>
        <td>${book.stockQuantity}</td>
        <td>${book.description}</td>
        <td><img src="${book.coverImage}" alt="${book.title}" width="50"></td>
        <td>
          <button class="view-btn" onclick="viewBook(${book.bookId})">View</button>
          <button class="edit-btn" onclick="editBook(${book.bookId})">Edit</button>
          <button class="delete-btn" onclick="deleteBook(${book.bookId})">Delete</button>
        </td>
      `;
    });
  } catch (error) {
    console.error("Error fetching books:", error);
  }
}

// Call fetchAndDisplayBooks when the page loads
document.addEventListener("DOMContentLoaded", fetchAndDisplayBooks);

// Placeholder functions for actions
function viewBook(bookId) {
  alert(`View book with ID: ${bookId}`);
}

function editBook(bookId) {
  alert(`Edit book with ID: ${bookId}`);
}

function deleteBook(bookId) {
  alert(`Delete book with ID: ${bookId}`);
}
