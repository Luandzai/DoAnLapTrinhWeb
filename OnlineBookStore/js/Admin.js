// Function to show the selected section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected section
    const activeSection = document.getElementById(sectionId);
    activeSection.style.display = 'block';
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
document.getElementById("addUserForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Lấy thông tin người dùng từ form
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const role = document.getElementById("role").value;

    // Tạo dòng mới trong bảng người dùng
    const table = document.getElementById("user-table").getElementsByTagName("tbody")[0];
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
