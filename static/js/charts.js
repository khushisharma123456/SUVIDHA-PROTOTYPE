document.addEventListener('DOMContentLoaded', function () {
    // Shared Chart Options (Minimalist & Clean)
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    color: '#f0f0f0'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    // --- ELECTRICITY CHART ---
    const ctxElec = document.getElementById('elecChart');
    if (ctxElec) {
        new Chart(ctxElec, {
            type: 'bar',
            data: {
                labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
                datasets: [{
                    label: 'Units (kWh)',
                    data: [180, 190, 210, 280, 320, 350, 310, 290, 220, 200, 180, 245],
                    backgroundColor: '#0F52BA',
                    borderRadius: 4
                }]
            },
            options: commonOptions
        });
    }

    // --- GAS CHART ---
    const ctxGas = document.getElementById('gasChart');
    if (ctxGas) {
        new Chart(ctxGas, {
            type: 'line',
            data: {
                labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
                datasets: [{
                    label: 'Units (SCM)',
                    data: [25, 22, 18, 15, 12, 10, 11, 13, 16, 20, 24, 18],
                    borderColor: '#FF9933',
                    backgroundColor: 'rgba(255, 153, 51, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: commonOptions
        });
    }

    // --- WATER CHART ---
    const ctxWater = document.getElementById('waterChart');
    if (ctxWater) {
        new Chart(ctxWater, {
            type: 'bar',
            data: {
                labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
                datasets: [{
                    label: 'Units (KL)',
                    data: [18, 19, 20, 22, 24, 25, 23, 21, 20, 19, 18, 22],
                    backgroundColor: '#00A86B',
                    borderRadius: 4
                }]
            },
            options: commonOptions
        });
    }
});
