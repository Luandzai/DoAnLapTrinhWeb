document.addEventListener('DOMContentLoaded', () => {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const resultDiv = document.getElementById('result');
    const filterForm = document.getElementById('filterForm');

    // Tự động điền năm (từ 2020 đến năm hiện tại)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2020; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const month = monthSelect.value;
        const year = yearSelect.value;

        if (!month || !year) {
            alert('Vui lòng chọn tháng và năm.');
            return;
        }

        try {
            resultDiv.innerHTML = 'Đang tải dữ liệu...';

            const response = await fetch(`http://localhost:5000/api/Revenue/GetMonthlyRevenue?month=${month}&year=${year}`);

            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.totalRevenue !== undefined && data.totalRevenue !== null) {
                const totalRevenueNumber = Number(data.totalRevenue);

                resultDiv.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Tháng</th>
                                <th>Năm</th>
                                <th>Tổng Doanh Thu (VNĐ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${data.month}</td>
                                <td>${data.year}</td>
                                <td>${totalRevenueNumber.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
            } else {
                resultDiv.innerHTML = `<p class="no-data">Không có dữ liệu doanh thu.</p>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            resultDiv.innerHTML = `<p class="no-data">Lỗi khi tải dữ liệu: ${error.message}</p>`;
        }
    });
});
