let bills = JSON.parse(localStorage.getItem('bills')) || [],
    payFrequency = localStorage.getItem('payFrequency') || '',
    payCycles = 3,
    income = parseFloat(localStorage.getItem('income')) || 0,
    payday = localStorage.getItem('payday') || '';

function saveToLocalStorage() {
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('payFrequency', payFrequency);
    localStorage.setItem('income', income.toString());
    localStorage.setItem('payday', payday);
}

function goToStep2() {
    payFrequency = document.getElementById('frequency').value;
    income = parseFloat(document.getElementById('income').value);
    payday = document.getElementById('payday').value;
    const yearlyIncome = calculateYearlyIncome(payFrequency, income);

    document.getElementById('incomeTable').innerHTML += `<tr><td>${payFrequency}</td><td>$${income.toFixed(2)}</td><td>${new Date(payday).toLocaleDateString()}</td><td>$${yearlyIncome.toFixed(2)}</td></tr>`;
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    saveToLocalStorage();
    updateAccordion();
}

function calculateYearlyIncome(frequency, income) {
    switch (frequency) {
        case 'fortnightly':
            return income * 26;
        case 'weekly':
            return income * 52;
        case 'monthly':
            return income * 12;
        default:
            return income;
    }
}

document.getElementById('billsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const billIndex = document.getElementById('billIndex').value,
        billName = document.getElementById('billName').value,
        billAmount = parseFloat(document.getElementById('billAmount').value),
        billFrequency = document.getElementById('billFrequency').value,
        billDate = document.getElementById('billDate').value;

    if (billIndex === '') {
        bills.push({ name: billName, amount: billAmount, frequency: billFrequency, date: billDate });
    } else {
        bills[billIndex] = { name: billName, amount: billAmount, frequency: billFrequency, date: billDate };
    }

    saveToLocalStorage();
    updateBillsTable();
    updateAccordion();
    resetBillForm();
    closeModal();
});

function updateBillsTable() {
    const billsTable = document.getElementById('billsTable');
    let totalYearlyAmount = 0;
    billsTable.innerHTML = `<tr><th>Bill Name</th><th>Bill Amount</th><th>Bill Frequency</th><th>Next Due Date</th><th>12-Monthly Total Amount</th><th>Actions</th></tr>`;
    bills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount += yearlyAmount;
        billsTable.innerHTML += `<tr><td>${bill.name}</td><td class="bills negative">-$${bill.amount.toFixed(2)}</td><td>${bill.frequency}</td><td>${new Date(bill.date).toLocaleDateString()}</td><td>-$${yearlyAmount.toFixed(2)}</td><td><button class="edit-btn" onclick="editBill(${index})">Edit</button></td></tr>`;
    });
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `<td colspan="4"><strong>Total Yearly Amount:</strong></td><td><strong>-$${totalYearlyAmount.toFixed(2)}</strong></td><td></td>`;
    billsTable.appendChild(totalRow);
}

function calculateYearlyAmount(amount, frequency) {
    let multiplier = 0;
    switch (frequency) {
        case 'weekly':
            multiplier = 52;
            break;
        case 'fortnightly':
            multiplier = 26;
            break;
        case 'monthly':
            multiplier = 12;
            break;
        case 'yearly':
            multiplier = 1;
            break;
    }
    return amount * multiplier;
}

function calculateYearlyBills() {
    let yearlyTotal = 0;
    bills.forEach(bill => {
        yearlyTotal += calculateYearlyAmount(bill.amount, bill.frequency);
    });
    document.getElementById('yearlyBillsAmount').innerText = `Total Yearly Bill Amount: $${yearlyTotal.toFixed(2)}`;
}

function removeBill(index) {
    bills.splice(index, 1);
    saveToLocalStorage();
    updateBillsTable();
    calculateYearlyBills();
}

function toggleBillList() {
    const billsTable = document.getElementById('billsTable');
    billsTable.style.display = billsTable.style.display === 'none' ? 'table' : 'none';
}

function editBill(index) {
    const bill = bills[index];
    document.getElementById('billIndex').value = index;
    document.getElementById('billName').value = bill.name;
    document.getElementById('billAmount').value = bill.amount;
    document.getElementById('billFrequency').value = bill.frequency;
    document.getElementById('billDate').value = bill.date;
    document.getElementById('submitBill').textContent = 'Save';
    openModal();
}

function resetBillForm() {
    document.getElementById('billIndex').value = '';
    document.getElementById('billName').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billFrequency').value = '';
    document.getElementById('billDate').value = '';
    document.getElementById('submitBill').textContent = 'Add Bill';
}

function updateAccordion() {
    const accordionContainer = document.getElementById('accordionContainer');
    accordionContainer.innerHTML = '';
    let currentDate = new Date(payday),
        cycleLength = getCycleLength(payFrequency),
        cycleDates = getCycleDates(currentDate, cycleLength, payCycles),
        chartData = { dates: [], totals: [] };

    cycleDates.forEach((dates, index) => {
        let cycleTotal = 0,
            cycleBills = '';
        bills.forEach(bill => {
            cycleBills += getBillRowsForCycle(bill, dates);
            cycleTotal += getBillTotalForCycle(bill, dates);
        });
        const leftoverAmount = income - cycleTotal;
        accordionContainer.innerHTML += `<button class="accordion">${dates.start.toDateString()} - ${dates.end.toDateString()}<span class="leftover">Leftover: $${leftoverAmount.toFixed(2)}</span></button><div class="panel"><div class="pay-cycle"><table><tr><td colspan="2">Income:</td><td class="positive">$${income.toFixed(2)}</td></tr><tr><td colspan="2">Total Bills:</td><td class="negative">-$${cycleTotal.toFixed(2)}</td></tr>${cycleBills}</table></div></div>`;
        chartData.dates.push(dates.start.toDateString());
        chartData.totals.push(cycleTotal);
    });

    document.querySelectorAll('.accordion').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });
    });
    updateChart(chartData);
}

function getCycleLength(frequency) {
    switch (frequency) {
        case 'weekly':
            return 7;
        case 'fortnightly':
            return 14;
        case 'monthly':
            return (new Date(new Date().setMonth(new Date().getMonth() + 1)) - new Date()) / (1000 * 60 * 60 * 24);
        default:
            return 0;
    }
}

function getCycleDates(startDate, cycleLength, cycles) {
    let dates = [];
    for (let i = 0; i < cycles; i++) {
        let endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + cycleLength);
        dates.push({ start: new Date(startDate), end: new Date(endDate) });
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() + 1);
    }
    return dates;
}

function getBillRowsForCycle(bill, dates) {
    let rows = '',
        billDueDate = new Date(bill.date);
    if (bill.frequency === 'yearly') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            rows += `<tr><td>${bill.name}</td><td>${billDueDate.toDateString()}</td><td class="bills negative">-$${bill.amount.toFixed(2)}</td></tr>`;
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
                rows += `<tr><td>${bill.name}</td><td>${billDueDate.toDateString()}</td><td class="bills negative">-$${bill.amount.toFixed(2)}</td></tr>`;
            }
            billDueDate = getNextBillDate(billDueDate, bill.frequency);
        }
    }
    return rows;
}

function getBillTotalForCycle(bill, dates) {
    let total = 0,
        billDueDate = new Date(bill.date);
    if (bill.frequency === 'yearly') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            total += bill.amount;
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
                total += bill.amount;
            }
            billDueDate = getNextBillDate(billDueDate, bill.frequency);
        }
    }
    return total;
}

function getNextBillDate(date, frequency) {
    switch (frequency) {
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'fortnightly':
            date.setDate(date.getDate() + 14);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
    }
    return date;
}

function loadMorePayCycles() {
    if (payCycles < 15) {
        payCycles += 3;
        updateAccordion();
    }
}

function updateChart(chartData) {
    const ctx = document.getElementById('financialChart').getContext('2d');
    if (window.financialChart && typeof window.financialChart.destroy === 'function') {
        window.financialChart.destroy();
    }
    window.financialChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.dates,
            datasets: [{
                label: 'Total Bills',
                data: chartData.totals,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true,
                    type: 'category',
                    labels: chartData.dates,
                    ticks: { autoSkip: true, maxTicksLimit: 20 },
                    title: { display: true, text: 'Start Date of Pay Cycle' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Bills' }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function resetLocalStorage() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        localStorage.clear();
        location.reload();
    }
}

// Modal functions
function openModal() {
    document.getElementById('billModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('billModal').style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == document.getElementById('billModal')) {
        closeModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (income) {
        const yearlyIncome = calculateYearlyIncome(payFrequency, income);
        document.getElementById('incomeTable').innerHTML += `<tr><td>${payFrequency}</td><td>$${income.toFixed(2)}</td><td>${new Date(payday).toLocaleDateString()}</td><td>$${yearlyIncome.toFixed(2)}</td></tr>`;
        document.getElementById('step1').classList.add('hidden');
        document.getElementById('step2').classList.remove('hidden');
    }
    updateBillsTable();
    updateAccordion();
});