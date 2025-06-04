function checkAuth(requireAdmin = false) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        window.location.href = '../html/Login.html';
        return false;
    }

    if (requireAdmin && user.role !== 'Admin') {
        window.location.href = '../html/index.html';
        return false;
    }

    return true;
}

// Override fetch để tự động thêm token
const originalFetch = window.fetch;
window.fetch = function () {
    let [url, config] = arguments;
    if (!config) {
        config = {};
    }
    if (!config.headers) {
        config.headers = {};
    }

    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return originalFetch(url, config);
};

// Kiểm tra auth khi trang load
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem có phải trang admin không
    const isAdminPage = window.location.href.includes('Admin') || 
                       window.location.href.includes('manage');
    checkAuth(isAdminPage);
});