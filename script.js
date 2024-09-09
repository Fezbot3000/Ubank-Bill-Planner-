// Initialize variables and load data from localStorage change
let bills = JSON.parse(localStorage.getItem('bills')) || [];
let payFrequency = localStorage.getItem('payFrequency') || '';
let income = parseFloat(localStorage.getItem('income')) || 0;
let payday = localStorage.getItem('payday') || '';
let viewMode = localStorage.getItem('viewMode') || 'payCycle';
let darkMode = localStorage.getItem('darkMode') === 'true';
let generatedPayCycles = 30; // Generate 12 months of pay cycles
let revealedPayCycles = 12; // Initially reveal 12 pay cycles instead of 3
let tags = JSON.parse(localStorage.getItem('tags')) || ['default'];
let oneOffIncomes = JSON.parse(localStorage.getItem('oneOffIncomes')) || []; // Load one-off incomes


// Load saved sortOrder from localStorage or use default values
let sortOrder;
try {
    sortOrder = JSON.parse(localStorage.getItem('sortOrder')) || {
        name: 'asc',
        amount: 'asc',
        frequency: 'asc',
        date: 'asc',
        tag: 'asc',
        totalAmount: 'asc'
    };
} catch (e) {
    sortOrder = {
        name: 'asc',
        amount: 'asc',
        frequency: 'asc',
        date: 'asc',
        tag: 'asc',
        totalAmount: 'asc'
    };
}

// Constants
const frequencyMultipliers = { 
    weekly: 52, 
    fortnightly: 26, 
    monthly: 12, 
    quarterly: 4,  
    yearly: 1,
    "one-off": 0 // No multiplier for one-off bills
};

function saveToLocalStorage() {
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('payFrequency', payFrequency);
    localStorage.setItem('income', income.toString());
    localStorage.setItem('payday', payday);
    localStorage.setItem('viewMode', viewMode);
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('tags', JSON.stringify(tags));
    localStorage.setItem('oneOffIncomes', JSON.stringify(oneOffIncomes));
    localStorage.setItem('sortOrder', JSON.stringify(sortOrder));

    // Save revealedPayCycles separately for each view mode
    localStorage.setItem('revealedPayCyclesPayCycle', viewMode === 'payCycle' ? revealedPayCycles : 3); 
    localStorage.setItem('revealedPayCyclesMonthly', viewMode === 'monthly' ? revealedPayCycles : 3); 
}

function calculateYearlyIncome(frequency, income) {
    return income * (frequencyMultipliers[frequency] || 0);
}

function calculateYearlyBills() {
    let yearlyTotal = 0;
    bills.forEach(bill => {
        yearlyTotal += calculateYearlyAmount(bill.amount, bill.frequency);
    });
    return yearlyTotal;
}

function calculateYearlyAmount(amount, frequency) {
    if (frequency === 'one-off') {
        return amount; // No multiplication for one-off amounts
    }
    return amount * (frequencyMultipliers[frequency] || 0);
}

function updateIncomeTable(payFrequency, income) {
    const yearlyIncome = calculateYearlyIncome(payFrequency, income);
    let totalOneOffIncome = 0;

    // Add the one-off incomes to the total yearly income
    oneOffIncomes.forEach(incomeItem => {
        totalOneOffIncome += incomeItem.amount;
    });

    const totalYearlyIncome = yearlyIncome + totalOneOffIncome;
    const yearlyBills = calculateYearlyBills();
    const potentialSavings = totalYearlyIncome - yearlyBills;
    const billPercentage = totalYearlyIncome > 0 ? (yearlyBills / totalYearlyIncome) * 100 : 0;
    const savingsPercentage = totalYearlyIncome > 0 ? (potentialSavings / totalYearlyIncome) * 100 : 0;

    // document.getElementById('incomeFrequency').className = '';
    document.getElementById('incomeFrequency').textContent = payFrequency;
    // document.getElementById('incomeAmount').className = 'right-align';
    document.getElementById('incomeAmount').textContent = `$${income.toFixed(2)}`;
    // document.getElementById('yearlyIncomeAmount').className = 'right-align';
    document.getElementById('yearlyIncomeAmount').textContent = `$${totalYearlyIncome.toFixed(2)}`;
    // document.getElementById('yearlyBillsAmount').className = 'right-align';
    document.getElementById('yearlyBillsAmount').textContent = `-$${yearlyBills.toFixed(2)}`;
    // document.getElementById('yearlyBillsPercentage').className = 'right-align';
    // document.getElementById('yearlyBillsPercentage').textContent = `${billPercentage.toFixed(2)}%`;
    // document.getElementById('yearlySavingsAmount').className = 'right-align';
    document.getElementById('yearlySavingsAmount').textContent = `$${potentialSavings.toFixed(2)}`;
    // document.getElementById('yearlySavingsPercentage').className = 'right-align';
    // document.getElementById('yearlySavingsPercentage').textContent = `${savingsPercentage.toFixed(2)}%`;
    var billsper = (yearlyBills/totalYearlyIncome)*100;
    billsper = billsper.toFixed(2);

    var savingsper = (potentialSavings/totalYearlyIncome)*100;
    savingsper = savingsper.toFixed(2);
    // update_ct_data(billsper,savingsper);
   
}

function update_ct_data(bills,savings) {
    const data = {
        labels: ['Bills', 'Savings'],
        datasets: [{
            label: 'Bills vs Savings',
            data: [bills, savings],
            backgroundColor: [
            'rgba(254, 99, 98, 1)',
            'rgba(255, 255, 255, 1)',
            ],
            hoverBackgroundColor: [
            'rgba(254, 99, 98, 1)',
            'rgba(255, 255, 255, 1)',
            ],
            borderRadius: 10,
            borderWidth: 0,
            circumference: 180,
        }],
        };

        const config = {
        type: 'doughnut',
        data: data,
        options: {
            plugins: {
            legend: {
                display: false,
            },
            },
            rotation: 270,
        },
        };
        
        const myChart = new Chart(
        document.getElementById('myChart'),
        config
        );
}

function goToStep2() {
    payFrequency = document.getElementById('frequency').value;
    income = parseFloat(document.getElementById('income').value);
    payday = document.getElementById('payday').value;

    if (isNaN(income) || income <= 0) {
        alert("Please enter a valid positive income.");
        return;
    }

    if (!payFrequency || !payday) {
        alert("Please ensure all fields are filled out correctly.");
        return;
    }

    updateIncomeTable(payFrequency, income);
    saveToLocalStorage();

    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');

    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) {
        chartContainer.style.display = 'block';
    }

    location.reload();  // Ensures that the pay cycles are shown correctly.
}

function toggleViewMode(mode) {
    const previousViewMode = viewMode;
    viewMode = mode;
    localStorage.setItem('viewMode', viewMode);

    // Update the h2 title based on the view mode
   

    // Update the "Load More" button text based on the view mode
    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        loadMoreButton.textContent = viewMode === 'payCycle' ? 'Load 3 More Pay Cycles' : 'Load 3 More Months';
    }

    if (previousViewMode !== viewMode) {
        revealedPayCycles = 12; // Reset to 12 cycles for both views when switching

        for (let i = 0; i < generatedPayCycles; i++) {
            localStorage.removeItem(`panel-open-${i}`);
        }
    }

    

    document.getElementById('accordionContainer').innerHTML = '';

    if (viewMode === 'payCycle') {
        updateAccordion();
        const cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);
        const chartData = { dates: [], billsData: [], incomeData: [] };

        cycleDates.forEach((dates, index) => {
            if (index >= revealedPayCycles) return;

            let cycleTotal = 0;
            let cycleIncome = income;

            const sortedBills = sortBillsByDate(bills);
            sortedBills.forEach(bill => {
                cycleTotal += getBillTotalForCycle(bill, dates);
            });

            oneOffIncomes.forEach(incomeItem => {
                const incomeDate = new Date(incomeItem.date);
                if (incomeDate >= dates.start && incomeDate <= dates.end) {
                    cycleIncome += incomeItem.amount;
                }
            });

            const formattedStartDate = formatDate(dates.start);
            chartData.dates.push(formattedStartDate);
            chartData.billsData.push(cycleTotal);
            chartData.incomeData.push(cycleIncome);
        });
        updateChart(chartData);

        
    } else if (viewMode === 'monthly') {
        const chartData = calculateMonthlyView();
        if (chartData.dates.length > 0) {
            updateAccordion();
            const limitedChartData = {
                dates: chartData.dates.slice(0, revealedPayCycles),
                totals: chartData.totals.slice(0, revealedPayCycles),
                bills: chartData.bills.slice(0, revealedPayCycles),
                incomes: chartData.incomes.slice(0, revealedPayCycles),
                leftovers: chartData.leftovers.slice(0, revealedPayCycles)
            };
            updateChart(limitedChartData);
        }
        
    }

}

document.addEventListener('DOMContentLoaded', () => {
    var myElem = document.getElementById('incomeFrequency');
    if (myElem !== null)
    {
        if (income > 0) {
            updateIncomeTable(payFrequency, income);  
        }
    }
    var myElem2 = document.getElementById('billsTable');
    if (myElem2 !== null)
    {
        updateBillsTable();
        updateTagDropdown(); 
    }

    var myElem3 = document.getElementById('accordionContainer');
    if (myElem3 !== null)
    {
        updateAccordion();
    }
    if(income=='')
    {
        openIncomeModal();
    }

    var el2 = document.getElementById('billtbl');
    if (el2 !== null)
    {
        updateBillsTable2();
    }

    var myElem5 = document.getElementById('accordionContainer2');
    if (myElem5 !== null)
    {
        updateAccordion2();
    }
    
       // Check if the browser supports service workers and register one
       if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
    }
});
// document.getElementById('viewMode').addEventListener('change', toggleViewMode);
/*
document.addEventListener('DOMContentLoaded', () => {
    // Load the saved view mode from localStorage
    viewMode = localStorage.getItem('viewMode') || 'payCycle'; // Default to 'payCycle' if not set
    document.getElementById('viewMode').value = viewMode; // Set the dropdown to the saved value

    // Force reset revealedPayCycles to 12 regardless of what's stored in localStorage
    if (viewMode === 'payCycle') {
        revealedPayCycles = 12;
        localStorage.setItem('revealedPayCyclesPayCycle', revealedPayCycles);
    } else if (viewMode === 'monthly') {
        revealedPayCycles = 12;
        localStorage.setItem('revealedPayCyclesMonthly', revealedPayCycles);
    }

    // Restore the bill list visibility state
    const isBillsListHidden = localStorage.getItem('billsListHidden') === 'true';
    const billsTable = document.getElementById('billsTable');
    const filterByTag = document.querySelector('.filter-by-tag');

    if (isBillsListHidden) {
        billsTable.classList.add('hidden');
        filterByTag.classList.add('hidden');
    } else {
        billsTable.classList.remove('hidden');
        filterByTag.classList.remove('hidden');
    }

    // Ensure payFrequency and payday are valid before proceeding
    if (payFrequency && payday) {
        toggleViewMode();
        updateBillsTable();
        deleteOldPayCycles();
        updateAccordion();

        // Make sure only the correct number of bars are displayed on initial load
        if (viewMode === 'monthly') {
            const chartData = calculateMonthlyView();
            const limitedChartData = {
                dates: chartData.dates.slice(0, revealedPayCycles),
                totals: chartData.totals.slice(0, revealedPayCycles),
                bills: chartData.bills.slice(0, revealedPayCycles),
                incomes: chartData.incomes.slice(0, revealedPayCycles),
                leftovers: chartData.leftovers.slice(0, revealedPayCycles)
            };
            updateChart(limitedChartData); 
        } else if (viewMode === 'payCycle') {
            updateAccordion();  // This will trigger updateChart as well
        }

        if (income > 0) {
            updateIncomeTable(payFrequency, income);
            document.getElementById('step1').classList.add('hidden');
            document.getElementById('step2').classList.remove('hidden');
        }
    }

    // Set dark mode if enabled
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('.container').classList.add('dark-mode');
    }

    // Apply saved sortOrder when the page loads
    const savedSortOrder = JSON.parse(localStorage.getItem('sortOrder'));
    if (savedSortOrder) {
        Object.keys(savedSortOrder).forEach(column => {
            if (savedSortOrder[column]) {
                sortOrder = savedSortOrder;  // Load the entire sortOrder object
                sortTable(column, false); // Sort the table based on the stored sort order without toggling
            }
        });
    } else {
        // If no sortOrder is saved, ensure we have a default sort order
        sortOrder = {
            name: 'asc',
            amount: 'asc',
            frequency: 'asc',
            date: 'asc',
            tag: 'asc',
            totalAmount: 'asc'
        };
    }
    
    // Ensure the sort arrows reflect the correct initial state
    const activeColumn = Object.keys(sortOrder).find(key => sortOrder[key] !== null);
    if (activeColumn) {
        updateSortArrows(activeColumn);
    }

    // Check if the browser supports service workers and register one
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
    }

    // Populate the tag dropdowns on page load
    updateTagDropdown();     
    setTimeout(() => {
        sortTable('date', false, 'asc');
    }, 500);
});
 */
var myElem22 = document.getElementById('billsForm');
    if (myElem22 !== null)
    {
        document.getElementById('billsForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const billIndex = document.getElementById('billIndex').value,
                billName = document.getElementById('billName').value,
                billAmount = parseFloat(document.getElementById('billAmount').value),
                billFrequency = document.getElementById('billFrequency').value,
                billDate = document.getElementById('billDate').value,
                billTag = document.getElementById('billTag').value.trim();

            if (isNaN(billAmount) || billAmount <= 0) {
                alert("Please enter a valid positive bill amount.");
                return;
            }

            if (!tags.includes(billTag)) {
                tags.push(billTag); // Add new tag to tags array
            }

            const newBill = { name: billName, amount: billAmount, frequency: billFrequency, date: billDate, tag: billTag };

            if (billIndex === '') {
                bills.push(newBill);
            } else {
                bills[billIndex] = newBill;
            }

            saveToLocalStorage();
            location.reload();
        });
    }

// One-Off Income Functions
function saveOneOffIncomesToLocalStorage() {
    localStorage.setItem('oneOffIncomes', JSON.stringify(oneOffIncomes));
}

function openOneOffIncomeModal(inp=0) {
    if(inp==1)
    {
        document.getElementById('incomeName').value = '';
        document.getElementById('oneOffIncomeAmount').value = '';
        document.getElementById('incomeDate').value = '';
        document.getElementById('incomeIndex').value = '';

        document.getElementById('submitOneOffIncome').textContent = 'Add Income';
    }
    document.getElementById('oneOffIncomeModal').style.display = 'block';
}

function closeOneOffIncomeModal() {
    document.getElementById('oneOffIncomeModal').style.display = 'none';
}

var myElem222 = document.getElementById('oneOffIncomeForm');
    if (myElem222 !== null)
    {
        document.getElementById('oneOffIncomeForm').addEventListener('submit', function(event) {
            event.preventDefault();

            const incomeIndex = document.getElementById('incomeIndex').value;
            const incomeName = document.getElementById('incomeName').value;
            const incomeAmountInput = document.getElementById('oneOffIncomeAmount');  // Use the original ID

            if (!incomeAmountInput) {
                return;
            }

            let incomeAmountRaw = incomeAmountInput.value.trim();

            if (incomeAmountRaw === "" || incomeAmountRaw === null) {
                alert("Income amount cannot be empty.");
                return;
            }

            let incomeAmount = parseFloat(incomeAmountRaw.replace(/,/g, ''));

            if (isNaN(incomeAmount) || incomeAmount <= 0) {
                alert("Please enter a valid positive income amount.");
                return;
            }

            const incomeDate = document.getElementById('incomeDate').value;
            const newIncome = { name: incomeName, amount: incomeAmount, date: incomeDate };
            
            if (incomeIndex === '') {
                oneOffIncomes.push(newIncome);
            } else {
                oneOffIncomes[incomeIndex] = newIncome;
            }

            saveOneOffIncomesToLocalStorage();
            location.reload();
        
            
        }); 
    }

function resetIncomeForm() {
    document.getElementById('incomeIndex').value = '';
    document.getElementById('incomeName').value = '';
    document.getElementById('oneOffIncomeAmount').value = '';
    document.getElementById('incomeDate').value = '';
    document.getElementById('submitOneOffIncome').textContent = 'Add Income';
}

function updateIncomeTableWithOneOffIncomes() {
    let totalOneOffIncome = 0;
    let processedIncomeNames = new Set();  // Use a Set to keep track of processed income names

    oneOffIncomes.forEach((income, index) => {
        if (!processedIncomeNames.has(income.name)) {
            totalOneOffIncome += income.amount;
            processedIncomeNames.add(income.name); // Mark this income as processed
        }
    });

    const yearlyIncome = calculateYearlyIncome(payFrequency, income) + totalOneOffIncome;
    const yearlyBills = calculateYearlyBills();
    const potentialSavings = yearlyIncome - yearlyBills;
    const billPercentage = yearlyIncome > 0 ? (yearlyBills / yearlyIncome) * 100 : 0;
    const savingsPercentage = yearlyIncome > 0 ? (potentialSavings / yearlyIncome) * 100 : 0;

    document.getElementById('yearlyIncomeAmount').textContent = `$${yearlyIncome.toFixed(2)}`;
    document.getElementById('yearlySavingsAmount').textContent = `$${potentialSavings.toFixed(2)}`;
    document.getElementById('yearlySavingsPercentage').textContent = `${savingsPercentage.toFixed(2)}%`;

    updateAccordion();
    updateBillsTable();
}

function updateBillDueDatesForDisplay() {
    const today = new Date();
    return bills.map(bill => {
        let displayBill = { ...bill };  // Clone the original bill object
        let billDueDate = new Date(displayBill.date);

        // Adjust the date forward if it's in the past
        if (billDueDate < today) {
            billDueDate = getNextBillDate(billDueDate, displayBill.frequency);
        }

        displayBill.displayDate = billDueDate.toISOString().split('T')[0];
        return displayBill;
    });
}

function updateBillsTable2() {
    const billsTable = document.getElementById('billtbl');
    let totalYearlyAmount = 0;

    const adjustedBills = updateBillDueDatesForDisplay();

    const sortedBills = adjustedBills;

    // Subtract bill amounts (as they are expenses)
    sortedBills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount -= yearlyAmount; // Subtract the yearly bill amounts
        var valA = new Date(bill.displayDate);
        var b = valA.getDate();
        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td class="bill-name">${bill.name}</td>
            <td class="bill-date" data-date="${bill.displayDate}">${b}${formatDaySuffix(b)}</td>
            <td class="bill-amount negative">-$${yearlyAmount.toFixed(2)}</td>
        </tr>`;
    });

    // // Add one-off incomes (as they are income)
    // oneOffIncomes.forEach((income, index) => {
    //     totalYearlyAmount += income.amount; // Add the income amounts

    //     billsTable.querySelector('tbody').innerHTML += `<tr>
    //         <td>${income.name}</td>
    //         <td class="positive right-align"><span class="price-data price-success">+$${income.amount.toFixed(2)}</span></td>
    //         <td>One-Off</td>
    //         <td data-date="${income.date}">${formatDate(income.date)}</td>
    //         <td>One-Off</td>
    //         <td class="right-align"><span class="price-data price-success">+$${income.amount.toFixed(2)}</span></td>
    //         <td>
    //             <button class="secondary-btn" onclick="editOneOffIncome(${index})">Edit</button>
    //             <button class="delete-btn" onclick="removeOneOffIncome(${index})">Delete</button>
    //         </td>
    //     </tr>`;
    // });

    // // Display the correct total at the bottom
    // const totalRow = `<tr><td colspan="5" class="total-label">Total Yearly Amount:</td><td class="right-align total-amount"><span class="price-data price-danger">${totalYearlyAmount < 0 ? '-' : ''}$${Math.abs(totalYearlyAmount).toFixed(2)}</span></td><td></td></tr>`;
    // billsTable.querySelector('tbody').insertAdjacentHTML('beforeend', totalRow);
}

function updateBillsTable() {
    const billsTable = document.getElementById('billsTable');
    let totalYearlyAmount = 0;

    const adjustedBills = updateBillDueDatesForDisplay();

    billsTable.innerHTML = `<thead>
                                <tr>
                                    <th onclick="sortTable('name')">Name <span id="nameSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('amount')">Amount <span id="amountSortArrow">↑</span></th>
                                    <th onclick="sortTable('frequency')">Frequency <span id="frequencySortArrow">↑</span></th>
                                    <th onclick="sortTable('date')">Due Date <span id="dateSortArrow">↑</span></th>
                                    <th onclick="sortTable('tag')">Tag <span id="tagSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('totalAmount')">Yearly Total <span id="totalAmountSortArrow">↑</span></th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>`;

    const sortedBills = adjustedBills;

    // Subtract bill amounts (as they are expenses)
    sortedBills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount -= yearlyAmount; // Subtract the yearly bill amounts

        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td>${bill.name}</td>
            <td class="bills negative right-align"><span class="price-data price-danger">-$${bill.amount.toFixed(2)}</span></td>
            <td>${bill.frequency}</td>
            <td data-date="${bill.displayDate}">${formatDate(bill.displayDate)}</td>
            <td>${bill.tag}</td>
            <td class="right-align"><span class="price">-$${yearlyAmount.toFixed(2)}</span></td>
            <td><button class="secondary-btn" onclick="editBill(${index})">Edit</button> <button class="delete-btn" onclick="removeBill(${index})">Delete</button></td>
        </tr>`;
    });

    // Add one-off incomes (as they are income)
    oneOffIncomes.forEach((income, index) => {
        totalYearlyAmount += income.amount; // Add the income amounts

        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td>${income.name}</td>
            <td class="positive right-align"><span class="price-data price-success">+$${income.amount.toFixed(2)}</span></td>
            <td>One-Off</td>
            <td data-date="${income.date}">${formatDate(income.date)}</td>
            <td>One-Off</td>
            <td class="right-align"><span class="price-data price-success">+$${income.amount.toFixed(2)}</span></td>
            <td>
                <button class="secondary-btn" onclick="editOneOffIncome(${index})">Edit</button>
                <button class="delete-btn" onclick="removeOneOffIncome(${index})">Delete</button>
            </td>
        </tr>`;
    });

    // Display the correct total at the bottom
    const totalRow = `<tr><td colspan="5" class="total-label">Total Yearly Amount:</td><td class="right-align total-amount"><span class="price-data price-danger">${totalYearlyAmount < 0 ? '-' : ''}$${Math.abs(totalYearlyAmount).toFixed(2)}</span></td><td></td></tr>`;
    billsTable.querySelector('tbody').insertAdjacentHTML('beforeend', totalRow);

 
}

function sortTable(column, toggleDirection = true, odr='') {
    // If the column is different from the previous sorted one, reset direction to ascending
    if (toggleDirection) {
        sortOrder[column] = sortOrder[column] === 'asc' ? 'desc' : 'asc';
    }

    const rows = Array.from(document.querySelector('#billsTable tbody').rows);
    const totalRow = rows.pop(); // Remove the last row (total row) from sorting

    rows.sort((a, b) => {
        let valA = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
        let valB = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();

        if (column === 'amount' || column === 'totalAmount') {
            valA = parseFloat(valA.replace(/[^0-9.-]+/g, ""));
            valB = parseFloat(valB.replace(/[^0-9.-]+/g, ""));
        } else if (column === 'date') {
            valA = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).getAttribute('data-date');
            valB = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).getAttribute('data-date');
            valA = new Date(valA);
            valB = new Date(valB);
        }
        if(odr!='')
        {
            sortOrder[column] = odr;
        }
        if (sortOrder[column] === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });

    const tbody = document.querySelector('#billsTable tbody');
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    tbody.appendChild(totalRow);

    updateSortArrows(column);
    localStorage.setItem('sortOrder', JSON.stringify(sortOrder)); // Save sortOrder to localStorage
}

function sortBills(bills) {
    const sortKey = Object.keys(sortOrder).find(key => sortOrder[key] !== null);
    const sortDirection = sortOrder[sortKey];

    return bills.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === 'amount' || sortKey === 'totalAmount') {
            valA = parseFloat(valA.replace(/[^0-9.-]+/g, ""));
            valB = parseFloat(valB.replace(/[^0-9.-]+/g, ""));
        } else if (sortKey === 'date') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        if (sortDirection === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? -1 : 1;
        }
    });
}

function getColumnIndex(column) {
    switch (column) {
        case 'name': return 1;
        case 'amount': return 2;
        case 'frequency': return 3;
        case 'date': return 4;
        case 'tag': return 5;
        case 'totalAmount': return 6; // Correct column index for Yearly Total
        default: return 0;
    }
}

function updateSortArrows(column) {
    const columns = ['name', 'amount', 'frequency', 'date', 'tag', 'totalAmount'];
    columns.forEach(col => {
        const arrow = document.getElementById(`${col}SortArrow`);
        if (arrow) {
            arrow.textContent = ''; // Clear the existing icon

            if (col === column) {
                arrow.textContent = sortOrder[column] === 'asc' ? '↑' : '↓';
            }
        }
    });
}

function removeBill(index) {
    const confirmed = confirm("Are you sure you want to delete this bill? This action cannot be undone.");
    if (confirmed) {
        bills.splice(index, 1);
        saveToLocalStorage();
        updateBillsTable();
        updateAccordion();
        calculateYearlyBills();
    }
}

function toggleBillList() {
    const billsTable = document.getElementById('billsTable');
    const filterByTag = document.querySelector('.filter-by-tag');

    // Toggle visibility
    billsTable.classList.toggle('hidden');
    filterByTag.classList.toggle('hidden');

    // Save the current state in localStorage
    const isHidden = billsTable.classList.contains('hidden');
    localStorage.setItem('billsListHidden', isHidden);
}

function editOneOffIncome(index) {
    const income = oneOffIncomes[index];
    if (income) {
        document.getElementById('incomeName').value = income.name;
        document.getElementById('oneOffIncomeAmount').value = income.amount.toFixed(2); // Ensure the value is properly formatted
        document.getElementById('incomeDate').value = income.date;
        document.getElementById('incomeIndex').value = index;  // Use a hidden input to track the index

        document.getElementById('submitOneOffIncome').textContent = 'Save Income';
        openOneOffIncomeModal();
    }
}

function removeOneOffIncome(index) {
    const confirmed = confirm("Are you sure you want to delete this one-off income? This action cannot be undone.");
    if (confirmed) {
        oneOffIncomes.splice(index, 1);
        saveOneOffIncomesToLocalStorage();
        location.reload();
    }
}

function editBill(index) {
    const bill = bills[index];

    if (bill) {
        document.getElementById('billIndex').value = index;
        document.getElementById('billName').value = bill.name;
        document.getElementById('billAmount').value = bill.amount;
        document.getElementById('billFrequency').value = bill.frequency;
        document.getElementById('billDate').value = bill.date;
        document.getElementById('billTag').value = bill.tag;

        document.getElementById('submitBill').textContent = 'Save';

        openModal(true);  // Pass true to indicate this is an edit
    }
}

function resetBillForm() {
    document.getElementById('billIndex').value = '';
    document.getElementById('billName').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billFrequency').value = '';
    document.getElementById('billDate').value = '';
    document.getElementById('billTag').value = 'default';
    document.getElementById('submitBill').textContent = 'Add Bill';
}

function adjustDate(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    if (day > lastDayOfMonth) {
        date.setDate(lastDayOfMonth);
    }

    return date;
}

function updateAccordion() {
    const accordionContainer = document.getElementById('accordionContainer');
    accordionContainer.innerHTML = ''; 

    let chartData = { dates: [], billsData: [], incomeData: [] };

    if (viewMode === 'payCycle') {
        updatePayCycleAccordion(chartData);
        const cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);

        cycleDates.forEach((dates, index) => {
            if (index >= revealedPayCycles) return;

            let cycleTotal = 0;
            let cycleIncome = income;

            const sortedBills = sortBillsByDate(bills);
            sortedBills.forEach(bill => {
                cycleTotal += getBillTotalForCycle(bill, dates);
            });

            oneOffIncomes.forEach(incomeItem => {
                const incomeDate = new Date(incomeItem.date);
                if (incomeDate >= dates.start && incomeDate <= dates.end) {
                    cycleIncome += incomeItem.amount; 
                }
            });

            const formattedStartDate = formatDate(dates.start);
            chartData.dates.push(formattedStartDate);
            chartData.billsData.push(cycleTotal);
            chartData.incomeData.push(cycleIncome);
        });

        updateChart(chartData);
    } else if (viewMode === 'monthly') {
        updateMonthlyAccordion(chartData);
        chartData = calculateMonthlyView();
        const limitedChartData = {
            dates: chartData.dates.slice(0, revealedPayCycles),
            totals: chartData.totals.slice(0, revealedPayCycles),
            bills: chartData.bills.slice(0, revealedPayCycles),
            incomes: chartData.incomes.slice(0, revealedPayCycles),
            leftovers: chartData.leftovers.slice(0, revealedPayCycles)
        };
        updateChart(limitedChartData); 
    }

    // Event listeners for accordion buttons
    document.querySelectorAll('.accordion-btn').forEach(button => {
        const index = button.getAttribute('data-index');
        button.addEventListener('click', function () {
            const panel = this.nextElementSibling;
            const isOpen = panel.style.display === 'block';

            panel.style.display = isOpen ? 'none' : 'block';
            this.querySelector('.toggle-text').textContent = isOpen ? 'Hide' : 'Show';

            localStorage.setItem(`panel-open-${index}`, !isOpen);
        });
    });

}

function updateAccordion2() {
    const accordionContainer = document.getElementById('accordionContainer2');
    accordionContainer.innerHTML = ''; 

    let chartData = { dates: [], billsData: [], incomeData: [] };
    
    updatePayCycleAccordion2(chartData);

    document.querySelectorAll('.accordion-btn').forEach(button => {
        const index = button.getAttribute('data-index');
        button.addEventListener('click', function () {
            const panel = this.nextElementSibling;
            const isOpen = panel.style.display === 'block';

            panel.style.display = isOpen ? 'none' : 'block';
            this.querySelector('.toggle-text').textContent = isOpen ? 'Hide' : 'Show';

            localStorage.setItem(`panel-open-${index}`, !isOpen);
        });
    });
}

// Helper function to add the correct suffix to the date
function formatDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

function sortBillsByDate(bills) {
    return bills.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB; // Sort in ascending order
    });
}

function getCycleLength(frequency) {
    let referenceDate = new Date(localStorage.getItem('payday'));

    // Check if frequency or referenceDate is invalid
    if (!frequency || isNaN(referenceDate.getTime())) {
        return 0; // Return 0 or some other appropriate default value
    }

    switch (frequency) {
        case 'weekly': 
            return 7;
        case 'fortnightly': 
            return 14;
        case 'monthly': 
            return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
        case 'quarterly': 
            return 90; // Average days in a quarter
        case 'yearly': 
            return 365;
        default: 
            return 0; // Return 0 or some other appropriate default value
    }
}

function getCycleDates(startDate, cycleLength, cycles) {
    let dates = [];
    for (let i = 0; i < cycles; i++) {
        let endDate = new Date(startDate);
        if (payFrequency === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);
        } else {
            endDate.setDate(endDate.getDate() + cycleLength - 1);
        }
        dates.push({ start: new Date(startDate), end: new Date(endDate) });
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() + 1);
    }
    return dates;
}

function getBillRowsForCycle(bill, dates) {
    let rows = '', billDueDate = new Date(bill.date);
    if (bill.frequency === 'yearly' || bill.frequency === 'one-off') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            rows += `<tr><td>${bill.name}</td><td>${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start) { // Include bills due on the start date of the cycle
                rows += `<tr><td>${bill.name}</td><td>${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
            }
            billDueDate = adjustDate(getNextBillDate(billDueDate, bill.frequency));
        }
    }
    return rows;
}

function formatDateWithLineBreak(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const d = new Date(date);
    const dayOfWeek = days[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    let daySuffix;

    if (day > 3 && day < 21) {
        daySuffix = 'th'; // 'th' for 4-20
    } else {
        switch (day % 10) {
            case 1:  daySuffix = "st"; break;
            case 2:  daySuffix = "nd"; break;
            case 3:  daySuffix = "rd"; break;
            default: daySuffix = "th";
        }
    }

    return `${dayOfWeek} ${day}${daySuffix} ${months[month]}<br>${year}`;
}

function getBillTotalForCycle(bill, dates) {
    let total = 0;
    let billDueDate = new Date(bill.date);

    if (bill.frequency === 'yearly' || bill.frequency === 'one-off') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            if (bill.amount < 0) {
                total += bill.amount; // Bills are added to the total (as they are negative)
            } else {
                total -= bill.amount; // Incomes are subtracted (as they are positive)
            }
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start) { // Include bills due on the start date of the cycle
                total += bill.amount; // Regular bills are added
            }
            billDueDate = getNextBillDate(billDueDate, bill.frequency);

            // Apply the same date adjustment logic as the month-to-month view within the loop
            if (bill.frequency === "monthly" || bill.frequency === "quarterly") {
                let lastDayOfMonth = new Date(billDueDate.getFullYear(), billDueDate.getMonth() + 1, 0).getDate();
                if (billDueDate.getDate() > lastDayOfMonth) {
                    billDueDate.setDate(lastDayOfMonth); // Adjust to the last valid day of the month
                }
            }
        }
    }

    return total;
}

function calculateMonthlyView() {
    let monthlyData = {
        dates: [],
        totals: [],
        bills: [],
        incomes: [],
        payDates: [],
        leftovers: [],
    };
    let currentDate = new Date(payday);
    let payDates = [];

    const totalMonths = 18;
    let date = new Date(payday);
    let endViewDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + totalMonths,
        0
    );

    while (date <= endViewDate) {
        payDates.push(new Date(date));
        date = adjustDate(getNextBillDate(new Date(date), payFrequency));
    }

    for (let i = 0; i < totalMonths; i++) {
        let startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let endDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        );
        let monthName = startDate.toLocaleString("default", { month: "long" });
        monthlyData.dates.push(`${monthName} ${currentDate.getFullYear()}`);

        let monthTotal = 0;
        let monthBills = "";
        let monthIncome = 0;
        let monthPayDates = [];
        let billsInMonth = [];

        // Calculate income for the month
        payDates.forEach((payDate) => {
            const payDateStartOfDay = new Date(
                payDate.getFullYear(),
                payDate.getMonth(),
                payDate.getDate()
            );

            if (payDateStartOfDay >= startDate && payDateStartOfDay <= endDate) {
                monthIncome += income;
                monthPayDates.push(payDate.toDateString());
            }
        });

        // Handle one-off incomes within the month
        oneOffIncomes.forEach((incomeItem) => {
            const incomeDate = new Date(incomeItem.date);
            if (incomeDate >= startDate && incomeDate <= endDate) {
                monthIncome += incomeItem.amount; // Add one-off income to the month's income
                monthBills += `<tr><td>${incomeItem.name}</td><td>${formatDayOnly(
                    incomeDate
                )}</td><td class="positive right-align">+$${incomeItem.amount.toFixed(2)}</td></tr>`;
            }
        });

        monthlyData.incomes[i] = monthIncome; // Store the income for the month
        monthlyData.payDates.push(monthPayDates);

        bills.forEach((bill) => {
            let billDueDate = new Date(bill.date);
            if (bill.frequency === "monthly") {
                if (billDueDate.getDate() > endDate.getDate()) {
                    billDueDate.setDate(endDate.getDate());
                }
                billsInMonth.push({
                    name: bill.name,
                    dueDate: new Date(billDueDate),
                    amount: bill.amount,
                });
            }
        });

        bills.forEach((bill) => {
            if (bill.frequency === "weekly" || bill.frequency === "fortnightly") {
                let billDueDate = new Date(bill.date);
                while (billDueDate <= endDate) {
                    if (billDueDate >= startDate && billDueDate <= endDate) {
                        billsInMonth.push({
                            name: bill.name,
                            dueDate: new Date(billDueDate),
                            amount: bill.amount,
                        });
                    }
                    billDueDate = getNextBillDate(billDueDate, bill.frequency);
                }
            }
        });

        bills.forEach((bill) => {
            let billDueDate = new Date(bill.date);
            if (bill.frequency === "quarterly") {
                if (
                    billDueDate.getMonth() % 3 === startDate.getMonth() % 3 &&
                    billDueDate.getFullYear() === startDate.getFullYear()
                ) {
                    billsInMonth.push({
                        name: bill.name,
                        dueDate: new Date(billDueDate),
                        amount: bill.amount,
                    });
                }
            } else if (
                bill.frequency === "yearly" ||
                bill.frequency === "one-off"
            ) {
                if (
                    billDueDate.getMonth() === startDate.getMonth() &&
                    billDueDate.getFullYear() === startDate.getFullYear()
                ) {
                    billsInMonth.push({
                        name: bill.name,
                        dueDate: new Date(billDueDate),
                        amount: bill.amount,
                    });
                }
            }
        });

        billsInMonth.sort((a, b) => a.dueDate - b.dueDate);

        billsInMonth.forEach((bill) => {
            monthBills += `<tr><td>${bill.name}</td><td>${formatDayOnly(
                bill.dueDate
            )}</td><td class="bills negative right-align">-$${bill.amount.toFixed(
                2
            )}</td></tr>`;
            monthTotal += bill.amount; // Add bill amounts (they're already negative)
        });

        monthlyData.totals.push(monthTotal);
        monthlyData.bills.push(monthBills);

        const leftoverAmount = monthIncome - monthTotal;
        monthlyData.leftovers.push(leftoverAmount);

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyData;
}

function getLastDayOfMonth(year, month) {
    var date = new Date(year , month + 1, 0);
    return date.getDate();
}

function getNextBillDate(date, frequency) {
    const originalDay = date.getDate();

    switch (frequency) {
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'fortnightly':
            date.setDate(date.getDate() + 14);
            break;
        case 'monthly':
            if(originalDay === 31) {
                var dmt = parseInt(date.getMonth())+1;
                var dyr = date.getFullYear();
                var lsdy = getLastDayOfMonth(dyr,dmt);
                date.setDate(lsdy);
                date.setMonth(date.getMonth() + 1);
               
                // if(date.getMonth()==9)
                // date.setDate(lastDayOfCurrentMonth);
                // date.setMonth(date.getMonth() + 1);
            }
            else if(originalDay === 30) {
                var dmt = parseInt(date.getMonth());
                var dyr = date.getFullYear();
                var lsdy = getLastDayOfMonth(dyr,dmt);
                if(lsdy==30)
                {
                    var mpt = dmt+1;
                    var tyy = getLastDayOfMonth(dyr,mpt);
                    date.setMonth(date.getMonth() + 1);
                    date.setDate(tyy);
                }
                else
                {
                    date.setMonth(date.getMonth() + 1);
                }
                
            }
            else
            {
                date.setMonth(date.getMonth() + 1);
            }
            break;
        case 'quarterly':
            date.setMonth(date.getMonth() + 3);
            if (date.getDate() < originalDay) {
                date.setDate(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
            }
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    // Apply general date adjustment to ensure it's a valid day within the month
    return adjustDate(date);
}

function loadMorePayCycles() {
  revealedPayCycles += 3; 

  // Save the updated revealedPayCycles for the current viewMode
  if (viewMode === 'payCycle') {
    localStorage.setItem('revealedPayCyclesPayCycle', revealedPayCycles);
  } else if (viewMode === 'monthly') {
    localStorage.setItem('revealedPayCyclesMonthly', revealedPayCycles);
  }

  updateAccordion(); 

  if (viewMode === 'monthly') {
    const chartData = calculateMonthlyView();
    const limitedChartData = {
      dates: chartData.dates.slice(0, revealedPayCycles),
      totals: chartData.totals.slice(0, revealedPayCycles),
      bills: chartData.bills.slice(0, revealedPayCycles),
      incomes: chartData.incomes.slice(0, revealedPayCycles),
      leftovers: chartData.leftovers.slice(0, revealedPayCycles)
    };
    updateChart(limitedChartData); 
  } else if (viewMode === 'payCycle') {
    const cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);
    const chartData = { dates: [], billsData: [], incomeData: [] };

    cycleDates.forEach((dates, index) => {
      if (index >= revealedPayCycles) return;

      let cycleTotal = 0;
      let cycleIncome = income;

      const sortedBills = sortBillsByDate(bills);
      sortedBills.forEach(bill => {
        cycleTotal += getBillTotalForCycle(bill, dates);
      });

      oneOffIncomes.forEach(incomeItem => {
        const incomeDate = new Date(incomeItem.date);
        if (incomeDate >= dates.start && incomeDate <= dates.end) {
          cycleIncome += incomeItem.amount; 
        }
      });

      const formattedStartDate = formatDate(dates.start);
      chartData.dates.push(formattedStartDate);
      chartData.billsData.push(cycleTotal);
      chartData.incomeData.push(cycleIncome);
    });

    updateChart(chartData);
  }
}

function updatePayCycleAccordion(chartData) {
  const accordionContainer = document.getElementById('accordionContainer');
  const cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);

  cycleDates.forEach((dates, index) => {
    if (index >= revealedPayCycles) return;

    let cycleTotal = 0;
    let cycleIncome = income;
    let cycleBills = '';

    const sortedBills = sortBillsByDate(bills);
    sortedBills.forEach(bill => {
      let billDueDate = adjustDate(new Date(bill.date));
 
      if (bill.frequency === 'yearly' || bill.frequency === 'one-off') {
     
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
          cycleBills += `<tr><td>${bill.name}</td><td data-date="${bill.date}">${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
          cycleTotal += bill.amount; 
        }
      } else {
        
        let iterationCount = 0; 
        while (billDueDate <= dates.end && iterationCount < 100) { 
           
          if (billDueDate >= dates.start && billDueDate <= dates.end) {
            
            cycleBills += `<tr><td>${bill.name}</td><td data-date="${bill.date}">${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
            cycleTotal += bill.amount;
          }
          
          billDueDate = getNextBillDate(billDueDate, bill.frequency);
       
  
          billDueDate = adjustDate(billDueDate);
          iterationCount++;
        }
        if (iterationCount >= 100) {
          console.warn(`Potential infinite loop detected for bill: ${bill.name}`);
        }
      }
    });

    // Reset the processed incomes at the start of each cycle to avoid duplicates
    let processedIncomes = new Set();

    oneOffIncomes.forEach(incomeItem => {
      const incomeDate = new Date(incomeItem.date);
      const incomeKey = `${incomeItem.name}-${incomeDate.toISOString()}`;

      if (incomeDate >= dates.start && incomeDate <= dates.end && !processedIncomes.has(incomeKey)) {
        cycleIncome += incomeItem.amount; 
        cycleBills += `<tr><td>${incomeItem.name}</td><td>${formatDateWithLineBreak(incomeDate)}</td><td class="positive right-align">+$${incomeItem.amount.toFixed(2)}</td></tr>`;
        processedIncomes.add(incomeKey); 
      }
    });

    const leftoverAmount = cycleIncome - cycleTotal; 
    const leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';
    const formattedStartDate = formatDate(dates.start);
    const formattedEndDate = formatDate(dates.end);

    const isOpen = localStorage.getItem(`panel-open-${index}`) === 'true';
    const panelStyle = isOpen ? 'block' : 'none';
    const toggleText = isOpen ? 'Hide' : 'Show';

    accordionContainer.innerHTML += `
    <div class="cycle-summary cycle-${index}">
      <div class="cycle-info">
        <span class="right-align">${formattedStartDate} - ${formattedEndDate}</span>
      </div>
      <div class="income-summary">
        <div class="box1">
            <div class="img-container">
                <img src="img/bill.svg">
            </div>
            <div class="title-container">
                <h3>Income</h3>
            </div>
            <div class="cycle">
                <span class="price-data">$${cycleIncome.toFixed(2)}</span>
            </div>
         </div>
         <div class="box2">
            <div class="img-container">
                <img src="img/bills.svg">
            </div>
            <div class="title-container">
                <h3>Estimated bills to pay</h3>
            </div>
            <div class="cycle">
                <span class="price-data negative">-$${cycleTotal.toFixed(2)}</span>
            </div>
         </div>
         <div class="box3">
            <div class="img-container">
                <img src="img/savings.svg">
            </div>
            <div class="title-container">
                <h3>Leftover</h3>
            </div>
            <div class="cycle">
                <span class="price-data ${leftoverClass}">$${leftoverAmount.toFixed(2)}</span>
            </div>
         </div>
  
      </div>
         <div class="mxc">
      <button class="accordion-btn" data-index="${index}">
        <span>Bills list</span>
        <span class="toggle-text">${toggleText}</span>
      </button>
      <div class="panel-content" style="display: ${panelStyle};">
        <table>
          ${cycleBills}
        </table>
      </div>
      </div>
    </div>
    `;
      var rows = document.querySelectorAll('.cycle-'+index+' table tr');

        rows = Array.prototype.slice.call(rows);
    
        rows.sort(function(rowA, rowB) {
            var aValue = rowA.querySelector(`td:nth-child(2)`).getAttribute('data-date');
            var bValue = rowB.querySelector(`td:nth-child(2)`).getAttribute('data-date');
    
            return aValue - bValue;
        });
    
        // Append the sorted rows to the table
        var table = document.querySelector('.cycle-'+index+' table');
        rows.forEach(function(row) {
            table.appendChild(row);
        });
  });
}

function updatePayCycleAccordion2(chartData) {
    const accordionContainer = document.getElementById('accordionContainer2');
    const cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);
  
    cycleDates.forEach((dates, index) => {
      if (index >= revealedPayCycles) return;
        
      if(index==0)
      {
        let cycleTotal = 0;
      let cycleIncome = income;
      let cycleBills = '';
  
      const sortedBills = sortBillsByDate(bills);
      if(sortedBills.length>0)
      {
        document.querySelector('.addbill').style.display = 'none';
      }
      sortedBills.forEach(bill => {
        let billDueDate = adjustDate(new Date(bill.date));
   
        if (bill.frequency === 'yearly' || bill.frequency === 'one-off') {
       
          if (billDueDate >= dates.start && billDueDate <= dates.end) {
            cycleBills += `<tr><td>${bill.name}</td><td data-date="${bill.date}">${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
            cycleTotal += bill.amount; 
          }
        } else {
          
          let iterationCount = 0; 
          while (billDueDate <= dates.end && iterationCount < 100) { 
             
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
              
              cycleBills += `<tr><td>${bill.name}</td><td data-date="${bill.date}">${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
              cycleTotal += bill.amount;
            }
            
            billDueDate = getNextBillDate(billDueDate, bill.frequency);
         
    
            billDueDate = adjustDate(billDueDate);
            iterationCount++;
          }
          if (iterationCount >= 100) {
            console.warn(`Potential infinite loop detected for bill: ${bill.name}`);
          }
        }
      });
  
      // Reset the processed incomes at the start of each cycle to avoid duplicates
      let processedIncomes = new Set();
  
      oneOffIncomes.forEach(incomeItem => {
        const incomeDate = new Date(incomeItem.date);
        const incomeKey = `${incomeItem.name}-${incomeDate.toISOString()}`;
  
        if (incomeDate >= dates.start && incomeDate <= dates.end && !processedIncomes.has(incomeKey)) {
          cycleIncome += incomeItem.amount; 
          cycleBills += `<tr><td>${incomeItem.name}</td><td>${formatDateWithLineBreak(incomeDate)}</td><td class="positive right-align">+$${incomeItem.amount.toFixed(2)}</td></tr>`;
          processedIncomes.add(incomeKey); 
        }
      });
  
      const leftoverAmount = cycleIncome - cycleTotal; 
      const leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';
      const formattedStartDate = formatDate(dates.start);
      const formattedEndDate = formatDate(dates.end);
  
      const isOpen = localStorage.getItem(`panel-open-${index}`) === 'true';
      const panelStyle = isOpen ? 'block' : 'none';
      const toggleText = isOpen ? 'Hide' : 'Show';
  
      accordionContainer.innerHTML += `
      <div class="cycle-summary cycle-${index}">
        <div class="cycle-info">
          <span class="right-align">${formattedStartDate} - ${formattedEndDate}</span>
        </div>
        <div class="income-summary">
          <div class="box1">
              <div class="img-container">
                  <img src="img/bill.svg">
              </div>
              <div class="title-container">
                  <h3>Income</h3>
              </div>
              <div class="cycle">
                  <span class="price-data">$${cycleIncome.toFixed(2)}</span>
              </div>
           </div>
           <div class="box2">
              <div class="img-container">
                  <img src="img/bills.svg">
              </div>
              <div class="title-container">
                  <h3>Estimated bills to pay</h3>
              </div>
              <div class="cycle">
                  <span class="price-data negative">-$${cycleTotal.toFixed(2)}</span>
              </div>
           </div>
           <div class="box3">
              <div class="img-container">
                  <img src="img/savings.svg">
              </div>
              <div class="title-container">
                  <h3>Leftover</h3>
              </div>
              <div class="cycle">
                  <span class="price-data ${leftoverClass}">$${leftoverAmount.toFixed(2)}</span>
              </div>
           </div>
    
        </div>
           <div class="mxc">
        <button class="accordion-btn" data-index="${index}">
          <span>Bills list</span>
          <span class="toggle-text">${toggleText}</span>
        </button>
        <div class="panel-content" style="display: ${panelStyle};">
          <table>
            ${cycleBills}
          </table>
        </div>
        </div>
      </div>
      `;
        var rows = document.querySelectorAll('.cycle-'+index+' table tr');
  
          rows = Array.prototype.slice.call(rows);
      
          rows.sort(function(rowA, rowB) {
              var aValue = rowA.querySelector(`td:nth-child(2)`).getAttribute('data-date');
              var bValue = rowB.querySelector(`td:nth-child(2)`).getAttribute('data-date');
      
              return aValue - bValue;
          });
      
          // Append the sorted rows to the table
          var table = document.querySelector('.cycle-'+index+' table');
          rows.forEach(function(row) {
              table.appendChild(row);
          });
      }
      
    });
  }

function updateMonthlyAccordion(chartData) {
    const accordionContainer = document.getElementById('accordionContainer');
    chartData = calculateMonthlyView();

    chartData.dates.forEach((monthYear, index) => {
        if (index >= revealedPayCycles) return;

        const monthTotal = chartData.totals[index];
        let billsForMonth = chartData.bills[index];
        let monthIncome = chartData.incomes[index];

        // Use a Set to track which one-off incomes have been processed
        const addedOneOffIncomes = new Set(); 

        oneOffIncomes.forEach(incomeItem => {
            const incomeDate = new Date(incomeItem.date);
            const incomeMonth = incomeDate.getMonth();
            const incomeYear = incomeDate.getFullYear();

            if (incomeMonth === new Date(monthYear).getMonth() && incomeYear === new Date(monthYear).getFullYear()) {
                if (!addedOneOffIncomes.has(incomeItem.name)) {
                    monthIncome += incomeItem.amount; 
                    // billsForMonth += `<tr><td>${incomeItem.name}</td><td>${incomeDate.getDate()}${formatDaySuffix(incomeDate.getDate())}</td><td class="positive right-align">+$${incomeItem.amount.toFixed(2)}</td></tr>`;
                    addedOneOffIncomes.add(incomeItem.name);
                }
            }
        });
        
        const leftoverAmount = monthIncome - monthTotal;
        const leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';

        const isOpen = localStorage.getItem(`panel-open-${index}`) === 'true';
        const panelStyle = isOpen ? 'block' : 'none';
        const toggleText = isOpen ? 'Hide' : 'Show';
        
        accordionContainer.innerHTML += `
        <div class="cycle-summary cycle-${index}">
            <div class="cycle-info">
                <span class="right-align">${monthYear}</span>
            </div>
            <div class="income-summary">
                <div class="box1">
                    <div class="img-container">
                        <img src="img/bill.svg">
                    </div>
                    <div class="title-container">
                        <h3>Income</h3>
                    </div>
                    <div class="cycle">
                        <span class="price-data">$${monthIncome.toFixed(2)}</span>
                    </div>
                </div>
                <div class="box2">
                    <div class="img-container">
                        <img src="img/bills.svg">
                    </div>
                    <div class="title-container">
                        <h3>Estimated bills to pay</h3>
                    </div>
                    <div class="cycle">
                        <span class="price-data negative">-$${monthTotal.toFixed(2)}</span>
                    </div>
                </div>
                <div class="box3">
                    <div class="img-container">
                        <img src="img/savings.svg">
                    </div>
                    <div class="title-container">
                        <h3>Leftover</h3>
                    </div>
                    <div class="cycle">
                        <span class="price-data ${leftoverClass}">$${leftoverAmount.toFixed(2)}</span>
                    </div>
                </div>
               
            </div>
             <div class="mxc">
            <button class="accordion-btn" data-index="${index}">
                <span>Bills list</span>
                <span class="toggle-text">${toggleText}</span>
            </button>
            <div class="panel-content" style="display: ${panelStyle};">
                <table>
                    ${billsForMonth}
                </table>
            </div>
            </div>
        </div>
        `;

        var rows = document.querySelectorAll('.cycle-'+index+' table tr');

        rows = Array.prototype.slice.call(rows);
    
        rows.sort(function(rowA, rowB) {
            var aValue = parseInt(rowA.querySelector(`td:nth-child(2)`).textContent, 10);
            var bValue = parseInt(rowB.querySelector(`td:nth-child(2)`).textContent, 10);
    
            return aValue - bValue;
        });
    
        // Append the sorted rows to the table
        var table = document.querySelector('.cycle-'+index+' table');
        rows.forEach(function(row) {
            table.appendChild(row);
        });

    });

   
}

function updateChart(chartData) {
    // Find all income-summary elements
    const incomeSummaries = document.querySelectorAll('.income-summary');

    if (incomeSummaries.length === 0) {
        console.error("No income summaries found.");
        return;
    }

    // Initialize arrays to store chart data
    const incomeData = [];
    const estimatedToPayData = [];
    const leftoverData = [];

    // Loop through each income-summary and extract data
    incomeSummaries.forEach(summary => {
        const income = parseFloat(summary.querySelector('.box1 span').textContent.replace(/[^0-9.-]+/g, ""));
        const estimatedToPay = parseFloat(summary.querySelector('.box2 span').textContent.replace(/[^0-9.-]+/g, ""));
        const leftover = parseFloat(summary.querySelector('.box3 span').textContent.replace(/[^0-9.-]+/g, ""));

        incomeData.push(income);
        estimatedToPayData.push(estimatedToPay);
        leftoverData.push(leftover);
    });

    // Ensure the number of data points matches the number of dates
    if (chartData.dates.length !== incomeData.length) {
        console.error("Mismatch between the number of chart dates and income summaries.");
        return;
    }

    // Destroy the previous chart instance if it exists
    if (window.financialChart && typeof window.financialChart.destroy === 'function') {
        window.financialChart.destroy();
    }

    // Clear the canvas before rendering the new chart
    const canvas = document.getElementById('financialChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Set up the chart with the extracted data
    window.financialChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.dates,
            datasets: [
                {
                    label: 'Total Bills',
                    data: estimatedToPayData,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    borderRadius: 10,
                    stack: 'Stack 0',
                },
                {
                    label: 'Leftover',
                    data: leftoverData,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: 10,
                    stack: 'Stack 0',
                }
            ]
        },
        options: {
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    type: 'category',
                    labels: chartData.dates,
                    ticks: { autoSkip: true, maxTicksLimit: 20 },
                    title: { display: false },
                    grid: {
                        display: false,
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        display: false,
                    },
                    ticks: {
                        callback: function (value) {
                            if (value >= 1000) {
                                return value / 1000 + 'k';
                            }
                            return value;
                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            }
        }
    });
}

function resetLocalStorage() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// Modal functions
function openModal(isEditMode = false) {
    if (!isEditMode) {
        resetBillForm();
    }
    document.getElementById('billModal').style.display = 'block';
    updateTagDropdown();
}

function closeModal() {
    document.getElementById('billModal').style.display = 'none';
}

function openIncomeModal() {
    document.getElementById('editFrequency').value = payFrequency;
    document.getElementById('editIncome').value = income;
    document.getElementById('editPayday').value = payday;
    document.getElementById('incomeModal').style.display = 'block';
}

function closeIncomeModal() {
    document.getElementById('incomeModal').style.display = 'none';
}

function updateIncome() {
    payFrequency = document.getElementById('editFrequency').value;
    income = parseFloat(document.getElementById('editIncome').value);
    payday = document.getElementById('editPayday').value;
    saveToLocalStorage();

    location.reload();
}

window.onclick = function(event) {
    if (event.target == document.getElementById('billModal')) {
        closeModal();
    }
    if (event.target == document.getElementById('incomeModal')) {
        closeIncomeModal();
    }
    if (event.target == document.getElementById('oneOffIncomeModal')) {
        closeOneOffIncomeModal();
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    document.querySelector('.container').classList.toggle('dark-mode');
    saveToLocalStorage();
}

function deleteOldPayCycles() {
    const today = new Date();
    const payCycles = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);
    const validPayCycles = payCycles.filter(cycle => cycle.end >= today);
    const numberOfCyclesToDelete = payCycles.length - validPayCycles.length;

    if (numberOfCyclesToDelete > 0) {
        generatedPayCycles -= numberOfCyclesToDelete;
        saveToLocalStorage();
    }
}

function updateTagDropdown() {
    // const tagList = document.getElementById('tagList');
    const existingTagSelect = document.getElementById('existingTag');
    const tagFilter = document.getElementById('tagFilter');
    
    // tagList.innerHTML = '';
    existingTagSelect.innerHTML = '';
    if (tagFilter !== null)
    {
        tagFilter.innerHTML = '<option value="all">All</option>';
    }
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        // tagList.appendChild(option);

        const selectOption = document.createElement('option');
        selectOption.value = tag;
        selectOption.textContent = tag;
        existingTagSelect.appendChild(selectOption);

        if (tagFilter !== null)
        {
            const filterOption = document.createElement('option');
            filterOption.value = tag;
            filterOption.textContent = tag;
            tagFilter.appendChild(filterOption);
        }
    });
}

function loadTagInfo() {
    const existingTag = document.getElementById('existingTag').value;
    document.getElementById('newTagName').value = existingTag;
}

function openManageTagsModal() {
    document.getElementById('manageTagsModal').style.display = 'block';
    updateTagDropdown();
}

function closeManageTagsModal() {
    document.getElementById('manageTagsModal').style.display = 'none';
}

function renameTag() {
    const oldTag = document.getElementById('existingTag').value;
    const newTag = document.getElementById('newTagName').value.trim();

    if (!newTag) {
        alert("New tag name cannot be empty.");
        return;
    }

    const tagIndex = tags.indexOf(oldTag);
    if (tagIndex > -1) {
        tags[tagIndex] = newTag;

        // Update tags in bills
        bills.forEach(bill => {
            if (bill.tag === oldTag) {
                bill.tag = newTag;
            }
        });

        saveToLocalStorage(); // Save updated tags and bills to localStorage
        updateBillsTable(); // Refresh the bills table to reflect changes
        updateTagDropdown(); // Refresh dropdowns with updated tags
        alert("Tag renamed successfully.");
    }
}

function deleteTag() {
    const tagToDelete = document.getElementById('existingTag').value;

    if (tagToDelete === 'default') {
        alert("Cannot delete the default tag.");
        return;
    }

    tags = tags.filter(tag => tag !== tagToDelete);

    bills.forEach(bill => {
        if (bill.tag === tagToDelete) {
            bill.tag = 'default';
        }
    });

    saveToLocalStorage();
    updateBillsTable();
    updateTagDropdown();
    alert("Tag deleted successfully.");

    closeManageTagsModal();
}

function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const d = new Date(date);
    const dayOfWeek = days[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    let daySuffix;

    if (day > 3 && day < 21) {
        daySuffix = 'th'; // 'th' for 4-20
    } else {
        switch (day % 10) {
            case 1:  daySuffix = "st"; break;
            case 2:  daySuffix = "nd"; break;
            case 3:  daySuffix = "rd"; break;
            default: daySuffix = "th";
        }
    }

    return `${dayOfWeek} ${day}${daySuffix} ${months[month]} ${year}`;
}

function formatDayOnly(date) {
    const day = date.getDate();

    let daySuffix;
    if (day > 3 && day < 21) {
        daySuffix = 'th';
    } else {
        switch (day % 10) {
            case 1:  daySuffix = "st"; break;
            case 2:  daySuffix = "nd"; break;
            case 3:  daySuffix = "rd"; break;
            default: daySuffix = "th";
        }
    }

    return `${day}${daySuffix}`;
}

function filterByTag() {
    const selectedTag = document.getElementById('tagFilter').value;
    const billsTable = document.getElementById('billsTable');
    const filteredBills = selectedTag === 'all' ? bills : bills.filter(bill => bill.tag === selectedTag);

    let totalYearlyAmount = 0;
    billsTable.innerHTML = `<thead>
                                <tr>
                                    <th onclick="sortTable('name')">Name <span id="nameSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('amount')">Amount <span id="amountSortArrow">↑</span></th>
                                    <th onclick="sortTable('frequency')">Frequency <span id="frequencySortArrow">↑</span></th>
                                    <th onclick="sortTable('date')">Due Date <span id="dateSortArrow">↑</span></th>
                                    <th onclick="sortTable('tag')">Tag <span id="tagSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('totalAmount')">Yearly Total <span id="totalAmountSortArrow">↑</span></th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>`;

    filteredBills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount += yearlyAmount;
        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td>${bill.name}</td>
            <td  class="bills negative right-align"><span class="price-data price-danger">-$${bill.amount.toFixed(2)}</span></td>
            <td>${bill.frequency}</td>
            <td>${formatDate(bill.date)}</td>
            <td>${bill.tag}</td>
            <td class="right-align"><span class="price-data price-danger">-$${yearlyAmount.toFixed(2)}</span></td>
            <td><button class="secondary-btn" onclick="editBill(${index})">Edit</button> <button class="delete-btn" onclick="removeBill(${index})">Delete</button></td>
        </tr>`;
    });

    const totalRow = `<tr><td colspan="5" class="total-label">Total Yearly Amount:</td><td class="right-align total-amount"><span class="price-data price-danger">-$${totalYearlyAmount.toFixed(2)}</span></td><td></td></tr>`;
    billsTable.querySelector('tbody').insertAdjacentHTML('beforeend', totalRow);
}

function exportData() {
    const data = {
        bills: bills,
        payFrequency: payFrequency,
        income: income,
        payday: payday,
        viewMode: viewMode,
        darkMode: darkMode,
        tags: tags,
        oneOffIncomes: oneOffIncomes
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);
            bills = data.bills || [];
            payFrequency = data.payFrequency || '';
            income = parseFloat(data.income) || 0;
            payday = data.payday || '';
            viewMode = data.viewMode || 'payCycle';
            darkMode = data.darkMode === true;
            tags = data.tags || ['default'];
            oneOffIncomes = data.oneOffIncomes || [];

            saveToLocalStorage();
            location.href = "index.html";
        };
        reader.readAsText(file);
    }
}

function autocompleteTag() {
    const tagInput = document.getElementById('billTag');
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';

    const inputValue = tagInput.value.toLowerCase();
    if (inputValue) {
        const filteredTags = tags.filter(tag => tag.toLowerCase().includes(inputValue));
        filteredTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            tagList.appendChild(option);
        });
    }
}

function capitalizeFirstLetterOfSentences() {
    const elements = document.querySelectorAll('body, h1, h2, h3, h4, h5, h6, p, a, span, li, td, th, button');

    elements.forEach(element => {
        if (element.innerText) {
            element.innerText = element.innerText.toLowerCase().replace(/(^\w{1}|\.\s*\w{1})/g, match => match.toUpperCase());
        }
    });
}


// document.getElementById('billTag').addEventListener('input', autocompleteTag);


jQuery(document).ready(function($) {
    $('.hide-button').click(function() {
        $('.bills-table').toggle();
        var buttonText = $('.bills-table').is(':visible') ? 'Hide' : 'Show';
        $(this).text(buttonText);
    });
});