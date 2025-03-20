// Global variables
let billsData = [];
let monthlyProjections = {
    'Mar': 0.00,
    'Apr': 0.00,
    'May': 0.00,
    'Jun': 0.00
};
let currentState = {
    month: 'Mar',
    year: 2025,
    view: 'monthly'
};
let billChart;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded");
    
    // Load saved data
    loadDataFromStorage();
    
    // Initialize Materialize components
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems, {
        dismissible: true,
        opacity: 0.5,
        inDuration: 300,
        outDuration: 200
    });
    
    // Initialize dropdowns
    var dropdownElems = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdownElems);
    
    // Initialize selects
    var selectElems = document.querySelectorAll('select');
    M.FormSelect.init(selectElems);
    
    // Initialize chart
    initChart();
    
    // Update chart with loaded data
    updateChart();
    
    // Update month tabs with loaded data
    updateMonthTabAmounts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update displays
    updateMonthDisplay();
    updateBillsDisplay();
});

// Direct modal open function
function openModal() {
    var modalElement = document.getElementById('add-bill-modal');
    var instance = M.Modal.getInstance(modalElement);
    
    if (instance) {
        instance.open();
    } else {
        // Try to reinitialize if instance not found
        instance = M.Modal.init(modalElement);
        if (instance) {
            instance.open();
        } else {
            console.error("Could not initialize modal");
            alert("Could not open the add bill form. Please refresh the page and try again.");
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add bill buttons
    document.getElementById('add-bill-button').onclick = function() {
        openModal();
    };
    
    document.getElementById('empty-add-button').onclick = function() {
        openModal();
    };
    
    // Save bill button
    document.getElementById('save-bill-btn').onclick = function() {
        saveBill();
    };
    
    // Settings button
    document.querySelector('.settings-icon').onclick = function(e) {
        e.preventDefault();
        var settingsDropdown = document.getElementById('settings-dropdown');
        if (settingsDropdown) {
            var instance = M.Dropdown.getInstance(settingsDropdown);
            if (instance) {
                instance.open();
            }
        } else {
            console.error("Settings dropdown not found");
        }
    };
    
    // Reset data button
    document.getElementById('reset-data-btn').onclick = function() {
        resetAllData();
    };
    
    // Month tabs
    document.querySelectorAll('.month-tab').forEach(tab => {
        tab.onclick = function() {
            // Remove active class from all tabs
            document.querySelectorAll('.month-tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update current month
            currentState.month = this.getAttribute('data-month');
            
            // Update display
            updateMonthDisplay();
            updateBillsDisplay();
        };
    });
    
    // Month navigation
    document.querySelector('.prev-month').onclick = function(e) {
        e.preventDefault();
        navigateMonth(-1);
    };
    
    document.querySelector('.next-month').onclick = function(e) {
        e.preventDefault();
        navigateMonth(1);
    };
}

// Initialize the chart
function initChart() {
    const ctx = document.getElementById('billChart').getContext('2d');
    
    const chartData = {
        labels: ['Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Projected Bills',
            data: [0.00, 0.00, 0.00, 0.00],
            backgroundColor: 'rgba(98, 0, 238, 0.2)',
            borderColor: 'rgba(98, 0, 238, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `$${context.raw.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value;
                    }
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };
    
    billChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });
}

// Update the chart with new data
function updateChart() {
    billChart.data.datasets[0].data = [
        monthlyProjections['Mar'],
        monthlyProjections['Apr'],
        monthlyProjections['May'],
        monthlyProjections['Jun']
    ];
    billChart.update();
}

// Update month display based on current state
function updateMonthDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Map short month names to month indices
    const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Update month display
    const monthIndex = monthMap[currentState.month];
    document.getElementById('current-month').textContent = `${monthNames[monthIndex]} ${currentState.year}`;
    
    // Update estimated amount
    document.getElementById('estimated-amount').textContent = `$${monthlyProjections[currentState.month].toFixed(2)}`;
}

// Update bills display based on current state
function updateBillsDisplay() {
    // Map short month names to month indices
    const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const currentMonthIndex = monthMap[currentState.month];
    
    // For monthly bills, we need to show them in every month
    // Filter bills for the current month view
    const currentMonthBills = billsData.filter(bill => {
        if (bill.frequency === 'monthly') {
            // Monthly bills show up every month
            return true;
        } else if (bill.frequency === 'weekly') {
            // Weekly bills show up every month
            return true;
        } else if (bill.frequency === 'yearly' && bill.dueDate.getMonth() === currentMonthIndex) {
            // Yearly bills only show up in their month
            return true;
        } else if (bill.frequency === 'one-time') {
            // One-time bills only show up in their specific month
            return bill.dueDate.getMonth() === currentMonthIndex && 
                  bill.dueDate.getFullYear() === currentState.year;
        }
        
        // Default case - check exact month match
        return bill.dueDate.getMonth() === currentMonthIndex && 
               bill.dueDate.getFullYear() === currentState.year;
    });
    
    console.log("Bills for current month:", currentMonthBills);
    
    // Check if there are any bills for the current month
    if (currentMonthBills.length > 0) {
        document.getElementById('bills-content').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
        
        // Update upcoming count
        document.getElementById('upcoming-count').textContent = `${currentMonthBills.length} coming up`;
        
        // Render the bills
        renderBillsList(currentMonthBills);
    } else {
        document.getElementById('bills-content').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';
    }
}

// Navigate month forward or backward
function navigateMonth(direction) {
    // Map short month names to month indices
    const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Map month indices to short month names
    const indexToMonth = Object.keys(monthMap).reduce((acc, month) => {
        acc[monthMap[month]] = month;
        return acc;
    }, {});
    
    // Get current month index
    let monthIndex = monthMap[currentState.month];
    let year = currentState.year;
    
    // Update month index
    monthIndex += direction;
    
    // Handle year change
    if (monthIndex < 0) {
        monthIndex = 11;
        year--;
    } else if (monthIndex > 11) {
        monthIndex = 0;
        year++;
    }
    
    // Update current state
    currentState.month = indexToMonth[monthIndex];
    currentState.year = year;
    
    // Update display
    updateMonthDisplay();
    updateBillsDisplay();
    
    // Update active tab
    document.querySelectorAll('.month-tab').forEach(tab => {
        if (tab.getAttribute('data-month') === currentState.month) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Save new bill
function saveBill() {
    console.log("Saving bill function called");
    
    try {
        // Get form values
        const name = document.getElementById('bill-name').value;
        const amount = parseFloat(document.getElementById('bill-amount').value);
        const dueDate = new Date(document.getElementById('bill-due-date').value);
        const frequency = document.getElementById('bill-frequency').value;
        
        console.log("Form values:", { name, amount, dueDate, frequency });
        
        // Validate form
        if (!name || isNaN(amount) || isNaN(dueDate.getTime()) || !frequency) {
            console.log("Form validation failed");
            alert('Please fill out all fields');
            return;
        }
        
        // Create new bill
        const newBill = {
            id: billsData.length + 1,
            name: name,
            amount: amount,
            dueDate: dueDate,
            frequency: frequency,
            icon: getIconForBill(name),
            paid: false
        };
        
        console.log("New bill object:", newBill);
        
        // Add bill to data
        billsData.push(newBill);
        
        // Reset monthly projections to ensure clean calculation
        monthlyProjections = {
            'Mar': 0.00,
            'Apr': 0.00,
            'May': 0.00,
            'Jun': 0.00
        };
        
        // Recalculate all projections from scratch
        console.log("Recalculating all projections");
        billsData.forEach(bill => {
            updateProjections(bill);
        });
        
        // Force update the chart and UI
        console.log("Forcing UI updates");
        updateChart();
        updateMonthTabAmounts();
        updateMonthDisplay();
        updateBillsDisplay();
        
        // Save data to localStorage
        saveDataToStorage();
        
        // Close modal
        var modalElement = document.getElementById('add-bill-modal');
        var instance = M.Modal.getInstance(modalElement);
        if (instance) {
            instance.close();
        }
        
        // Reset form
        document.getElementById('add-bill-form').reset();
        
        // Show success message
        alert('Bill added successfully');
        
        // Log final state
        console.log("Final monthly projections:", {...monthlyProjections});
        console.log("Bills data:", [...billsData]);
    } catch (error) {
        console.error("Error saving bill:", error);
        alert("An error occurred while saving the bill. Please try again.");
    }
}

// Get icon for bill based on name
function getIconForBill(name) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('netflix')) return 'netflix';
    if (nameLower.includes('spotify')) return 'spotify';
    if (nameLower.includes('optus')) return 'optus';
    if (nameLower.includes('date')) return 'date';
    
    // Default icon based on first letter
    return name.charAt(0).toLowerCase();
}

// Get icon HTML based on bill type
function getIconHTML(bill) {
    switch(bill.icon) {
        case 'netflix':
            return '<i class="fas fa-film"></i>';
        case 'spotify':
            return '<i class="fab fa-spotify"></i>';
        case 'optus':
            return 'OPTUS';
        case 'date':
            return '<i class="fas fa-calendar"></i>';
        default:
            return bill.name.charAt(0).toUpperCase();
    }
}

// Update projections based on new bill
function updateProjections(bill) {
    console.log("Updating projections for bill:", bill);
    
    // For monthly bills, add to all months
    if (bill.frequency === "monthly") {
        console.log("Processing monthly bill");
        for (let monthKey in monthlyProjections) {
            console.log(`Adding ${bill.amount} to ${monthKey}`);
            monthlyProjections[monthKey] += bill.amount;
        }
    } else if (bill.frequency === "one-time") {
        // Map short month names to month indices
        const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        // Map month indices to short month names
        const indexToMonth = Object.keys(monthMap).reduce((acc, month) => {
            acc[monthMap[month]] = month;
            return acc;
        }, {});
        
        // Get month of the bill
        const billMonth = bill.dueDate.getMonth();
        const monthKey = indexToMonth[billMonth];
        console.log("One-time bill for month:", monthKey);
        
        if (monthlyProjections.hasOwnProperty(monthKey)) {
            monthlyProjections[monthKey] += bill.amount;
        }
    } else if (bill.frequency === "weekly") {
        // For weekly bills, add to all months with 4 occurrences
        for (let monthKey in monthlyProjections) {
            console.log(`Adding weekly bill (${bill.amount} × 4) to ${monthKey}`);
            monthlyProjections[monthKey] += bill.amount * 4;
        }
    } else if (bill.frequency === "yearly") {
        // Map month indices
        const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        // Map month indices to short month names
        const indexToMonth = Object.keys(monthMap).reduce((acc, month) => {
            acc[monthMap[month]] = month;
            return acc;
        }, {});
        
        // Get month of the bill
        const billMonth = bill.dueDate.getMonth();
        const monthKey = indexToMonth[billMonth];
        console.log("Yearly bill for month:", monthKey);
        
        if (monthlyProjections.hasOwnProperty(monthKey)) {
            monthlyProjections[monthKey] += bill.amount;
        }
    }
    
    console.log("Updated projections:", {...monthlyProjections});
    
    // Force UI update
    updateChart();
    updateMonthTabAmounts();
}

// Update month tab amounts
function updateMonthTabAmounts() {
    document.getElementById('mar-amount').textContent = `$${monthlyProjections['Mar'].toFixed(2)}`;
    document.getElementById('apr-amount').textContent = `$${monthlyProjections['Apr'].toFixed(2)}`;
    document.getElementById('may-amount').textContent = `$${monthlyProjections['May'].toFixed(2)}`;
    document.getElementById('jun-amount').textContent = `$${monthlyProjections['Jun'].toFixed(2)}`;
}

// Get days until due
function getDaysUntilDue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Format due date string
function formatDueDate(dueDate, daysUntilDue) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[dueDate.getDay()];
    const date = dueDate.getDate();
    const monthName = months[dueDate.getMonth()];
    
    let dueText;
    if (daysUntilDue === 0) {
        dueText = 'Due today';
    } else if (daysUntilDue === 1) {
        dueText = 'Due tomorrow';
    } else if (daysUntilDue > 1) {
        dueText = `Due in ${daysUntilDue} days`;
    } else {
        dueText = `Overdue by ${Math.abs(daysUntilDue)} days`;
    }
    
    return `${dueText} • ${dayName} ${date} ${monthName}`;
}

// Render bills list
function renderBillsList(bills) {
    const container = document.getElementById('bills-list-container');
    if (!container) {
        console.error("Bills list container not found");
        return;
    }
    
    container.innerHTML = '';
    
    console.log("Rendering bills:", bills);
    
    // Sort bills by due date
    bills.sort((a, b) => a.dueDate - b.dueDate);
    
    // Create bill elements
    bills.forEach((bill, index) => {
        try {
            const isLast = index === bills.length - 1;
            const daysUntilDue = getDaysUntilDue(bill.dueDate);
            const dueDateStr = formatDueDate(bill.dueDate, daysUntilDue);
            
            const billItem = document.createElement('div');
            billItem.className = 'bill-item';
            billItem.innerHTML = `
                <div class="bill-status">
                    <div class="${bill.paid ? 'status-dot' : 'status-empty'}"></div>
                    ${!isLast ? '<div class="status-line"></div>' : ''}
                </div>
                <div class="bill-content">
                    <div class="due-date">${dueDateStr}</div>
                    <div class="bill-info">
                        <div class="bill-icon ${bill.icon}">${getIconHTML(bill)}</div>
                        <div class="bill-name">${bill.name}</div>
                        <div class="bill-amount">$${bill.amount.toFixed(2)}</div>
                    </div>
                </div>
            `;
            
            container.appendChild(billItem);
        } catch (error) {
            console.error("Error rendering bill:", error, bill);
        }
    });
}

// Save data to localStorage
function saveDataToStorage() {
    try {
        // Convert dates to ISO string for proper serialization
        const billsToSave = billsData.map(bill => ({
            ...bill,
            dueDate: bill.dueDate.toISOString()
        }));
        
        localStorage.setItem('billPlannerData', JSON.stringify(billsToSave));
        localStorage.setItem('billPlannerProjections', JSON.stringify(monthlyProjections));
        console.log("Data saved to localStorage");
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
    }
}

// Load data from localStorage
function loadDataFromStorage() {
    try {
        const savedBills = localStorage.getItem('billPlannerData');
        const savedProjections = localStorage.getItem('billPlannerProjections');
        
        if (savedBills) {
            // Parse the bills and convert ISO date strings back to Date objects
            const parsedBills = JSON.parse(savedBills);
            billsData = parsedBills.map(bill => ({
                ...bill,
                dueDate: new Date(bill.dueDate)
            }));
            console.log("Loaded bills from localStorage:", billsData);
        }
        
        if (savedProjections) {
            monthlyProjections = JSON.parse(savedProjections);
            console.log("Loaded projections from localStorage:", monthlyProjections);
        }
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
        // If there's an error, reset to defaults
        billsData = [];
        monthlyProjections = {
            'Mar': 0.00,
            'Apr': 0.00,
            'May': 0.00,
            'Jun': 0.00
        };
    }
}

// Reset all data
function resetAllData() {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        billsData = [];
        monthlyProjections = {
            'Mar': 0.00,
            'Apr': 0.00,
            'May': 0.00,
            'Jun': 0.00
        };
        
        // Clear localStorage
        localStorage.removeItem('billPlannerData');
        localStorage.removeItem('billPlannerProjections');
        
        // Update UI
        updateChart();
        updateMonthTabAmounts();
        updateMonthDisplay();
        updateBillsDisplay();
        
        alert("All data has been reset");
        
        // Force reload the page to ensure everything is reset
        window.location.reload();
    }
}