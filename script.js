// Global variables
let billsData = [];
let monthlyProjections = {}; // Will be populated dynamically
let currentState = {
    month: '', // Will be set to current month
    year: new Date().getFullYear(),
    view: 'monthly' // 'monthly', 'yearly'
};
let billChart;
let visibleMonths = []; // Array to store visible months in the current view
let displayedMonths = []; // Array to store 4 currently displayed months

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded");
    
    // Set current month
    const currentDate = new Date();
    const monthAbbr = getMonthAbbreviation(currentDate.getMonth());
    currentState.month = monthAbbr;
    currentState.year = currentDate.getFullYear();
    
    // Initialize the visible months based on current view
    updateVisibleDateRange();
    
    // Initialize empty projections for each visible month
    initializeProjections();
    
    // Load saved data (this will update projections based on saved bills)
    loadDataFromStorage();
    
    // Initialize Materialize components
    initializeMaterializeComponents();
    
    // Set initial displayed months
    updateDisplayedMonths();
    
    // Create month tabs dynamically
    createMonthTabs();
    
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
    
    console.log("Initialization complete with projections:", monthlyProjections);
});

// Helper function to get month abbreviation
function getMonthAbbreviation(monthIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
}

// Helper function to get month index from abbreviation
function getMonthIndex(monthAbbr) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthAbbr);
}

// Update the active month tab
function updateActiveMonthTab() {
    document.querySelectorAll('.month-tab').forEach(tab => {
        const tabMonth = tab.getAttribute('data-month');
        const tabYear = parseInt(tab.getAttribute('data-year'));
        
        if (tabMonth === currentState.month && tabYear === currentState.year) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Enhanced bill filtering function
function filterBillsByYearAndMonth(bills, year, month = null) {
    return bills.filter(bill => {
        const billYear = bill.dueDate.getFullYear();
        
        // If year doesn't match, immediately return false
        if (billYear !== year) {
            return false;
        }
        
        // If no specific month is provided, return all bills for the year
        if (month === null) {
            return true;
        }
        
        // Convert month to index if it's a string abbreviation
        const monthIndex = typeof month === 'string' 
            ? getMonthIndex(month) 
            : month;
        
        return bill.dueDate.getMonth() === monthIndex;
    });
}

// Fix for updating visible date range to show more years
function updateVisibleDateRange() {
    visibleMonths = [];
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    if (currentState.view === 'monthly' || currentState.view === 'weekly') {
        // Show 12 months into the future
        for (let i = 0; i < 12; i++) {
            let targetMonth = (currentMonth + i) % 12;
            let targetYear = currentYear + Math.floor((currentMonth + i) / 12);
            
            visibleMonths.push({
                month: getMonthAbbreviation(targetMonth),
                year: targetYear,
                // Create a unique key for this month/year combination
                key: `${getMonthAbbreviation(targetMonth)}-${targetYear}`
            });
        }
    } else if (currentState.view === 'yearly') {
        // Show 10 years (current year + 9 years) instead of just 6
        for (let i = 0; i < 10; i++) {
            visibleMonths.push({
                month: 'Jan', // Just use January as a marker for the year
                year: currentYear + i,
                key: `Jan-${currentYear + i}`
            });
        }
    }
    
    // Set the current month to the first in the range if it's not in the range
    if (!visibleMonths.find(m => m.month === currentState.month && m.year === currentState.year)) {
        currentState.month = visibleMonths[0].month;
        currentState.year = visibleMonths[0].year;
    }
    
    console.log("Visible months/years:", visibleMonths);
}

// Fix updateDisplayedMonths to always show 4 consecutive months/years
function updateDisplayedMonths() {
    if (currentState.view === 'yearly') {
        // For yearly view, show 4 consecutive years, starting with the current year
        const currentYearKey = `Jan-${currentState.year}`;
        let startIndex = visibleMonths.findIndex(m => m.key === currentYearKey);
        
        if (startIndex === -1) {
            // If current year not found, start from the beginning
            startIndex = 0;
        }
        
        // Ensure we don't go past the end of visible months
        if (startIndex > visibleMonths.length - 4) {
            startIndex = Math.max(0, visibleMonths.length - 4);
        }
        
        displayedMonths = visibleMonths.slice(startIndex, startIndex + 4);
    } else {
        // Existing month navigation logic
        const currentMonthKey = `${currentState.month}-${currentState.year}`;
        const currentIndex = visibleMonths.findIndex(m => m.key === currentMonthKey);
        
        if (currentIndex === -1) {
            console.error("Current month not found in visible months");
            return;
        }
        
        let startIndex = currentIndex;
        if (startIndex > visibleMonths.length - 4) {
            startIndex = Math.max(0, visibleMonths.length - 4);
        }
        
        displayedMonths = visibleMonths.slice(startIndex, startIndex + 4);
    }
    
    console.log("Displayed months/years:", displayedMonths);
}

// Initialize Materialize components
function initializeMaterializeComponents() {
    var elems = document.querySelectorAll('.modal');
    var modalInstances = M.Modal.init(elems, {
        dismissible: true,
        opacity: 0.5,
        inDuration: 300,
        outDuration: 200
    });
    
    var dropdownElems = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdownElems);
    
    var selectElems = document.querySelectorAll('select');
    M.FormSelect.init(selectElems);
}


// Initialize projections for each visible month
function initializeProjections() {
    monthlyProjections = {};
    
    visibleMonths.forEach(monthData => {
        monthlyProjections[monthData.key] = 0.00;
    });
    
    console.log("Initialized projections:", monthlyProjections);
}

// Modify createMonthTabs to include the year in yearly view
function createMonthTabs() {
    const tabsContainer = document.querySelector('.month-tabs');
    tabsContainer.innerHTML = ''; // Clear existing tabs
    
    displayedMonths.forEach((monthData, index) => {
        const isActive = (monthData.month === currentState.month && monthData.year === currentState.year);
        
        const tab = document.createElement('div');
        tab.className = `month-tab ${isActive ? 'active' : ''}`;
        tab.setAttribute('data-month', monthData.month);
        tab.setAttribute('data-year', monthData.year);
        tab.setAttribute('data-key', monthData.key);
        
        // For yearly view, show the year instead of just the month
        let labelText = monthData.month;
        if (currentState.view === 'yearly') {
            labelText = monthData.year.toString();
        }
        
        tab.innerHTML = `
            <div class="amount" id="${monthData.key.toLowerCase()}-amount">$0.00</div>
            <div class="month">${labelText}</div>
        `;
        
        tabsContainer.appendChild(tab);
    });
}

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

// Fix setupEventListeners to use the new handleViewChange function
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
        }
    };
    
    // Reset data button
    document.getElementById('reset-data-btn').onclick = function() {
        resetAllData();
    };
    
    // View type selection
    document.querySelectorAll('#month-dropdown a').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const viewType = this.textContent.toLowerCase();
            
            // Use the new handleViewChange function
            handleViewChange(viewType);
        });
    });
    
    // Setup month tab listeners
    setupMonthTabListeners();
    
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

// Setup month tab listeners
function setupMonthTabListeners() {
    document.querySelectorAll('.month-tab').forEach(tab => {
        tab.onclick = function() {
            // Remove active class from all tabs
            document.querySelectorAll('.month-tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update current month and year
            currentState.month = this.getAttribute('data-month');
            currentState.year = parseInt(this.getAttribute('data-year'));
            
            // Update display
            updateMonthDisplay();
            updateBillsDisplay();
            updateChart(); // Also update chart for active month
        };
    });
}

// Fix initChart to handle yearly view correctly
function initChart() {
    console.group('Initializing Chart');
    
    const ctx = document.getElementById('billChart').getContext('2d');
    
    // Ensure projections are calculated
    recalculateYearlyProjections();
    
    // Get labels and data for displayed months
    const labels = displayedMonths.map(m => m.month);
    const data = displayedMonths.map(m => monthlyProjections[m.key] || 0);
    
    console.log('Chart labels:', labels);
    console.log('Chart data:', data);
    
    // Set min/max for Y-axis
    const maxValue = Math.max(...data, 100); // Minimum height of 100
    
    const chartData = {
        labels: labels,
        datasets: [{
            label: currentState.view === 'yearly' ? 'Yearly Projected Bills' : 'Projected Bills',
            data: data,
            backgroundColor: function(context) {
                const index = context.dataIndex;
                if (index >= displayedMonths.length) return 'rgba(226, 232, 240, 0.6)';
                
                const month = displayedMonths[index].month;
                const year = displayedMonths[index].year;
                
                return (month === currentState.month && year === currentState.year) ? 
                    'rgba(98, 0, 238, 0.6)' : 'rgba(226, 232, 240, 0.6)';
            },
            borderColor: function(context) {
                const index = context.dataIndex;
                if (index >= displayedMonths.length) return 'rgba(226, 232, 240, 1)';
                
                const month = displayedMonths[index].month;
                const year = displayedMonths[index].year;
                
                return (month === currentState.month && year === currentState.year) ? 
                    'rgba(98, 0, 238, 1)' : 'rgba(226, 232, 240, 1)';
            },
            borderWidth: 1,
            barPercentage: 0.8,
            categoryPercentage: 0.8,
            borderRadius: 4
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
                suggestedMax: maxValue * 1.2, // Add padding
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                },
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
    
    // Destroy previous chart if it exists
    if (billChart) {
        billChart.destroy();
    }
    
    // Create new chart
    billChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
    
    console.log('Chart initialized');
    console.groupEnd();
}

// Fix updateChart to display the correct data
function updateChart() {
    console.group('Updating Chart');
    
    if (!billChart) {
        initChart();
        return;
    }
    
    // Ensure projections are up to date
    recalculateYearlyProjections();
    
    // Get data for displayed months
    const data = displayedMonths.map(m => {
        return monthlyProjections[m.key] || 0;
    });
    
    console.log('Chart data:', data);
    
    // Set min/max for Y-axis based on data
    const maxValue = Math.max(...data, 100); // Ensure minimum height
    
    // Update Y-axis scale
    billChart.options.scales.y.suggestedMax = maxValue * 1.2;
    
    // Update chart data
    billChart.data.datasets[0].data = data;
    billChart.data.labels = displayedMonths.map(m => m.month);
    
    // Update colors to highlight active month/year
    billChart.data.datasets[0].backgroundColor = function(context) {
        const index = context.dataIndex;
        if (index >= displayedMonths.length) return 'rgba(226, 232, 240, 0.6)';
        
        const month = displayedMonths[index].month;
        const year = displayedMonths[index].year;
        
        return (month === currentState.month && year === currentState.year) ? 
            'rgba(98, 0, 238, 0.6)' : 'rgba(226, 232, 240, 0.6)';
    };
    
    billChart.data.datasets[0].borderColor = function(context) {
        const index = context.dataIndex;
        if (index >= displayedMonths.length) return 'rgba(226, 232, 240, 1)';
        
        const month = displayedMonths[index].month;
        const year = displayedMonths[index].year;
        
        return (month === currentState.month && year === currentState.year) ? 
            'rgba(98, 0, 238, 1)' : 'rgba(226, 232, 240, 1)';
    };
    
    // Update the chart
    billChart.update();
    
    console.groupEnd();
}

// Fix updateMonthDisplay to show year in yearly view
function updateMonthDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let displayText;
    
    if (currentState.view === 'yearly') {
        // For yearly view, just show the year
        displayText = `${currentState.year}`;
    } else {
        // For monthly/weekly view, show month and year
        const monthIndex = getMonthIndex(currentState.month);
        displayText = `${monthNames[monthIndex]} ${currentState.year}`;
    }
    
    // Update display
    document.getElementById('current-month').textContent = displayText;
    
    // Find the current month/year key
    const currentKey = `${currentState.month}-${currentState.year}`;
    
    // Update estimated amount
    const estimatedAmount = monthlyProjections[currentKey] || 0;
    document.getElementById('estimated-amount').textContent = 
        `$${estimatedAmount.toFixed(2)}`;
}

// Enhanced updateBillsDisplay function to show recurring bills in yearly view with proper labels
function updateBillsDisplay() {
    console.group('Updating Bills Display');
    console.log('Current state:', currentState);
    
    // Filter bills based on the current view and selected month/year
    let filteredBills = [];
    let totalAmount = 0;
    
    if (currentState.view === 'yearly') {
        // For yearly view, get all bills that apply to the selected year
        const baseYearBills = billsData.filter(bill => {
            const billYear = bill.dueDate.getFullYear();
            
            // For one-time bills, only show if it's in the current year
            if (bill.frequency === 'one-time') {
                return billYear === currentState.year;
            }
            
            // For recurring bills (monthly, weekly, yearly), show if they started on or before the current year
            return billYear <= currentState.year;
        });
        
        // For yearly view, we need to expand recurring bills to show their full yearly impact
        filteredBills = [];
        baseYearBills.forEach(bill => {
            // Add the original bill
            filteredBills.push({...bill});
            
            // For monthly and weekly bills, add an indicator that they're recurring
            if (bill.frequency === 'monthly') {
                filteredBills[filteredBills.length - 1].displayName = `${bill.name} (Monthly - 12× per year)`;
                totalAmount += (bill.amount * 12);
            } else if (bill.frequency === 'weekly') {
                filteredBills[filteredBills.length - 1].displayName = `${bill.name} (Weekly - 52× per year)`;
                totalAmount += (bill.amount * 52);
            } else {
                // One-time and yearly bills
                totalAmount += bill.amount;
            }
        });
    } else {
        // For monthly view, get bills for the current month/year
        const currentMonthIndex = getMonthIndex(currentState.month);
        
        // Filter bills based on frequency and date
        filteredBills = billsData.filter(bill => {
            const billMonth = bill.dueDate.getMonth();
            const billYear = bill.dueDate.getFullYear();
            
            if (bill.frequency === 'monthly') {
                // Show monthly bills for all months after their start date
                return (billYear < currentState.year) || 
                       (billYear === currentState.year && billMonth <= currentMonthIndex);
            } else if (bill.frequency === 'weekly') {
                // Show weekly bills for all months after their start date
                return (billYear < currentState.year) || 
                       (billYear === currentState.year && billMonth <= currentMonthIndex);
            } else if (bill.frequency === 'yearly') {
                // Show yearly bills that fall in this month (any year on or after start)
                return billMonth === currentMonthIndex && billYear <= currentState.year;
            } else if (bill.frequency === 'one-time') {
                // Show one-time bills only for the exact month and year
                return billMonth === currentMonthIndex && billYear === currentState.year;
            }
            
            return false;
        });
        
        // Calculate the total amount for the month
        filteredBills.forEach(bill => {
            if (bill.frequency === 'weekly') {
                totalAmount += (bill.amount * 4); // Weekly bills occur 4 times per month
                bill.displayName = `${bill.name} (Weekly - 4× per month)`;
            } else if (bill.frequency === 'monthly') {
                totalAmount += bill.amount;
                bill.displayName = `${bill.name} (Monthly)`;
            } else if (bill.frequency === 'yearly') {
                totalAmount += bill.amount;
                bill.displayName = `${bill.name} (Yearly)`;
            } else {
                // One-time bills
                totalAmount += bill.amount;
            }
        });
    }
    
    console.log('Filtered bills:', filteredBills);
    console.log('Total amount:', totalAmount);
    
    // Update the UI with the filtered bills and total amount
    if (filteredBills.length > 0) {
        document.getElementById('bills-content').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
        
        // Update the number of upcoming bills
        document.getElementById('upcoming-count').textContent = `${filteredBills.length} coming up`;
        
        // Update the estimated amount to pay
        document.getElementById('estimated-amount').textContent = `$${totalAmount.toFixed(2)}`;
        
        // Render the bills list with display names
        renderBillsList(filteredBills);
    } else {
        document.getElementById('bills-content').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';
    }
    
    console.groupEnd();
}

// Add debug logger to help with troubleshooting
function debugLog(message, data) {
    // Force log to console even if console is not visible
    if (typeof message === 'string') {
        setTimeout(console.log.bind(console, '%c' + message, 'color: blue; font-weight: bold;'), 0);
    } else {
        setTimeout(console.log.bind(console, message), 0);
    }
    
    if (data !== undefined) {
        setTimeout(console.log.bind(console, data), 0);
    }
}

// Comprehensive Debugging Function
function debugProjections() {
    console.group('Projection Debugging');
    
    console.log('Current State:', {
        month: currentState.month,
        year: currentState.year,
        view: currentState.view
    });
    
    console.log('Visible Months:', visibleMonths);
    
    console.log('Bills Data:', billsData.map(bill => ({
        name: bill.name,
        amount: bill.amount,
        frequency: bill.frequency,
        dueDate: bill.dueDate,
        fullKey: `${getMonthAbbreviation(bill.dueDate.getMonth())}-${bill.dueDate.getFullYear()}`
    })));
    
    console.log('Monthly Projections:', {...monthlyProjections});
    
    // Check projection details for current months
    visibleMonths.forEach(monthData => {
        const key = monthData.key;
        const projection = monthlyProjections[key] || 0;
        
        console.log(`Month ${key}:`, {
            projection: projection,
            matchingBills: billsData.filter(bill => {
                const billMonth = getMonthAbbreviation(bill.dueDate.getMonth());
                const billYear = bill.dueDate.getFullYear();
                const billKey = `${billMonth}-${billYear}`;
                return billKey === key;
            }).map(bill => ({
                name: bill.name,
                amount: bill.amount,
                frequency: bill.frequency,
                dueDate: bill.dueDate
            }))
        });
    });
    
    console.groupEnd();
}

window.addEventListener('error', function(event) {
    console.error('Uncaught error:', event.error);
});

// Fix navigateMonth to correctly update displayed months/years
function navigateMonth(direction) {
    console.group('Month/Year Navigation');
    
    if (currentState.view === 'yearly') {
        // For yearly view, navigate by years instead of months
        const newYear = currentState.year + direction;
        
        // Check if the new year is within the visible years range
        const newYearKey = `Jan-${newYear}`;
        const newYearIndex = visibleMonths.findIndex(m => m.key === newYearKey);
        
        if (newYearIndex === -1) {
            console.log(`Year ${newYear} is not in visible range`);
            console.groupEnd();
            return;
        }
        
        // Update current year
        currentState.year = newYear;
        
        // Update displayed months to include the new year
        updateDisplayedMonths();
        createMonthTabs();
        setupMonthTabListeners();
    } else {
        // Find current month's index in visible months
        const currentMonthKey = `${currentState.month}-${currentState.year}`;
        const currentIndex = visibleMonths.findIndex(m => m.key === currentMonthKey);
        
        if (currentIndex === -1) {
            console.error("Current month not found in visible months");
            console.groupEnd();
            return;
        }
        
        const newIndex = currentIndex + direction;
        
        // Check navigation bounds
        if (newIndex < 0 || newIndex >= visibleMonths.length) {
            console.log("Cannot navigate outside of visible range");
            console.groupEnd();
            return;
        }
        
        // Get new month data
        const newMonthData = visibleMonths[newIndex];
        currentState.month = newMonthData.month;
        currentState.year = newMonthData.year;
        
        // Ensure displayed months are updated if needed
        const isInDisplayedMonths = displayedMonths.some(m => 
            m.month === currentState.month && m.year === currentState.year
        );
        
        if (!isInDisplayedMonths) {
            updateDisplayedMonths();
            createMonthTabs();
            setupMonthTabListeners();
        }
    }
    
    console.log("New selection:", {
        month: currentState.month,
        year: currentState.year
    });
    
    // Recalculate projections
    recalculateYearlyProjections();
    
    // Update UI components
    updateChart();
    updateMonthDisplay();
    updateBillsDisplay();
    updateMonthTabAmounts();
    updateActiveMonthTab();
    
    console.groupEnd();
}

// Add a global debugging function that can be called from console
window.debugBillPlanner = function() {
    debugProjections();
};

// Fix saveBill to properly update all data after saving
function saveBill() {
    console.group('Saving Bill');
    
    try {
        // Get form values
        const billName = document.getElementById('bill-name').value;
        const billAmount = parseFloat(document.getElementById('bill-amount').value);
        const billDueDate = new Date(document.getElementById('bill-due-date').value);
        const billFrequency = document.getElementById('bill-frequency').value;
        
        // Validate form
        if (!billName || isNaN(billAmount) || !billDueDate || !billFrequency) {
            alert('Please fill in all fields correctly.');
            console.error('Form validation failed');
            console.groupEnd();
            return;
        }
        
        // Create bill object
        const newBill = {
            id: Date.now(),
            name: billName,
            amount: billAmount,
            dueDate: billDueDate,
            frequency: billFrequency,
            paid: false,
            icon: getIconForBill(billName)
        };
        
        console.log('New bill:', newBill);
        
        // Add to bills array
        billsData.push(newBill);
        
        // Recalculate projections
        recalculateYearlyProjections();
        
        // Close modal
        var modalElement = document.getElementById('add-bill-modal');
        var instance = M.Modal.getInstance(modalElement);
        if (instance) {
            instance.close();
        }
        
        // Reset form
        document.getElementById('add-bill-form').reset();
        
        // Save to localStorage
        saveDataToStorage();
        
        // Update UI
        updateChart();
        updateMonthTabAmounts();
        updateBillsDisplay();
        updateMonthDisplay();
        
        console.log('Bill saved successfully');
    } catch (error) {
        console.error('Error saving bill:', error);
        alert('Failed to save bill. Please try again.');
    }
    
    console.groupEnd();
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
            return '<i class="fab fa-netflix"></i>';
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

// Fix for updateProjections function to properly handle yearly view
function updateProjections(bill) {
    console.group(`Projecting Bill: ${bill.name}`);
    console.log('Bill details:', {
        name: bill.name,
        amount: bill.amount,
        frequency: bill.frequency,
        dueDate: bill.dueDate,
        currentView: currentState.view
    });
    
    // Create a deep copy of visibleMonths to ensure we're working with the full range
    const processMonths = [...visibleMonths];
    
    processMonths.forEach(monthData => {
        const key = monthData.key;
        const monthYear = key.split('-');
        const month = monthYear[0];
        const year = parseInt(monthYear[1]);
        
        // Ensure the key exists in projections
        if (!monthlyProjections.hasOwnProperty(key)) {
            monthlyProjections[key] = 0;
        }
        
        // Get bill details
        const billYear = bill.dueDate.getFullYear();
        const billMonth = getMonthAbbreviation(bill.dueDate.getMonth());
        
        // Determine if bill applies to this month/year based on frequency
        let shouldAddToProjection = false;
        let amountToAdd = bill.amount;
        
        switch(bill.frequency) {
            case "one-time":
                // Only add to the exact month/year
                shouldAddToProjection = (billMonth === month && billYear === year);
                break;
                
            case "monthly":
                // Add to all months
                shouldAddToProjection = true;
                break;
                
            case "weekly":
                // Add to all months (4 weeks per month)
                shouldAddToProjection = true;
                amountToAdd = bill.amount * 4; // 4 weeks per month
                break;
                
            case "yearly":
                // Add to the specific month each year
                shouldAddToProjection = (billMonth === month && billYear === year);
                break;
                
            default:
                console.warn(`Unknown bill frequency: ${bill.frequency}`);
                break;
        }
        
        // Add to projection if applicable
        if (shouldAddToProjection) {
            monthlyProjections[key] += amountToAdd;
            console.log(`Adding ${amountToAdd} to ${key} for ${bill.name}`);
        }
    });
    
    console.log('Updated Projections:', {...monthlyProjections});
    console.groupEnd();
}


// Fix updateMonthTabAmounts to properly update the month tab amounts
function updateMonthTabAmounts() {
    console.group('Updating Month Tab Amounts');
    
    // Force recalculation of projections to ensure they're up to date
    recalculateYearlyProjections();
    
    // Update each month tab with the current projection amount
    document.querySelectorAll('.month-tab').forEach(tab => {
        const key = tab.getAttribute('data-key');
        const amountElement = tab.querySelector('.amount');
        
        if (amountElement && monthlyProjections[key] !== undefined) {
            const amount = monthlyProjections[key];
            amountElement.textContent = `$${amount.toFixed(2)}`;
            console.log(`Updated tab ${key} amount: $${amount.toFixed(2)}`);
        } else {
            console.warn(`Could not update tab amount for key: ${key}`);
        }
    });
    
    // Update the current month's estimated amount
    const currentKey = `${currentState.month}-${currentState.year}`;
    const estimatedAmount = monthlyProjections[currentKey] || 0;
    
    const estimatedElement = document.getElementById('estimated-amount');
    if (estimatedElement) {
        estimatedElement.textContent = `$${estimatedAmount.toFixed(2)}`;
        console.log(`Updated estimated amount: $${estimatedAmount.toFixed(2)}`);
    }
    
    console.groupEnd();
}

// Fix handleViewChange function to properly update when switching views
function handleViewChange(viewType) {
    console.group('View Change');
    console.log(`Changing view to: ${viewType}`);
    
    // Update the current view
    currentState.view = viewType;
    
    // Update the dropdown button text
    document.querySelector('.dropdown-trigger[data-target="month-dropdown"] span').textContent = 
        viewType.charAt(0).toUpperCase() + viewType.slice(1);
    
    // Update visible date range based on the new view
    updateVisibleDateRange();
    
    // Recalculate projections for the new view
    recalculateYearlyProjections();
    
    // Update displayed months and redraw the UI
    updateDisplayedMonths();
    createMonthTabs();
    setupMonthTabListeners();
    
    // Update chart and display
    updateChart();
    updateMonthDisplay();
    updateBillsDisplay();
    updateMonthTabAmounts();
    
    console.log('View change complete');
    console.groupEnd();
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

// Fix for the yearly projections to properly project recurring bills into future years
function recalculateYearlyProjections() {
    console.group('Recalculating Yearly Projections');
    
    // First, reset all projections to zero
    visibleMonths.forEach(monthData => {
        monthlyProjections[monthData.key] = 0;
    });
    
    // For each bill, calculate its contribution to each month/year
    billsData.forEach(bill => {
        const billYear = bill.dueDate.getFullYear();
        const billMonth = getMonthAbbreviation(bill.dueDate.getMonth());
        
        visibleMonths.forEach(monthData => {
            const [month, year] = monthData.key.split('-');
            const yearNum = parseInt(year);
            
            // For yearly view, we need to handle bills differently
            if (currentState.view === 'yearly') {
                if (bill.frequency === 'one-time') {
                    // One-time bills only appear in their specific year
                    if (yearNum === billYear) {
                        monthlyProjections[monthData.key] += bill.amount;
                        console.log(`Adding one-time bill ${bill.name} ($${bill.amount}) to ${monthData.key}`);
                    }
                } else if (bill.frequency === 'monthly') {
                    // Monthly bills appear in every year - add monthly × 12
                    // For future years, add monthly bills if bill was created before that year
                    if (yearNum >= billYear) {
                        monthlyProjections[monthData.key] += (bill.amount * 12);
                        console.log(`Adding monthly bill ${bill.name} ($${bill.amount * 12}) to ${monthData.key}`);
                    }
                } else if (bill.frequency === 'weekly') {
                    // Weekly bills appear in every year - add weekly × 52
                    // For future years, add weekly bills if bill was created before that year
                    if (yearNum >= billYear) {
                        monthlyProjections[monthData.key] += (bill.amount * 52);
                        console.log(`Adding weekly bill ${bill.name} ($${bill.amount * 52}) to ${monthData.key}`);
                    }
                } else if (bill.frequency === 'yearly') {
                    // Yearly bills appear in every year from their start date
                    if (yearNum >= billYear) {
                        monthlyProjections[monthData.key] += bill.amount;
                        console.log(`Adding yearly bill ${bill.name} ($${bill.amount}) to ${monthData.key}`);
                    }
                }
            } else {
                // For monthly view, handle bills based on their frequency
                switch(bill.frequency) {
                    case 'one-time':
                        // One-time bills only appear in their specific month/year
                        if (month === billMonth && yearNum === billYear) {
                            monthlyProjections[monthData.key] += bill.amount;
                        }
                        break;
                    case 'monthly':
                        // Monthly bills appear in every month after their start date
                        if (yearNum > billYear || 
                            (yearNum === billYear && getMonthIndex(month) >= bill.dueDate.getMonth())) {
                            monthlyProjections[monthData.key] += bill.amount;
                        }
                        break;
                    case 'weekly':
                        // Weekly bills appear in every month after their start date
                        if (yearNum > billYear || 
                            (yearNum === billYear && getMonthIndex(month) >= bill.dueDate.getMonth())) {
                            monthlyProjections[monthData.key] += (bill.amount * 4);
                        }
                        break;
                    case 'yearly':
                        // Yearly bills appear in the same month each year after start date
                        if (month === billMonth && yearNum >= billYear) {
                            monthlyProjections[monthData.key] += bill.amount;
                        }
                        break;
                }
            }
        });
    });
    
    console.log('Final calculated projections:', {...monthlyProjections});
    console.groupEnd();
    
    return monthlyProjections;
}

// Enhanced renderBillsList to show display names for recurring bills
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
                        <div class="bill-name">${bill.displayName || bill.name}</div>
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
        
        // Save bills data (this is the primary data source)
        localStorage.setItem('billPlannerData', JSON.stringify(billsToSave));
        
        // Save state (view type, current month/year)
        localStorage.setItem('billPlannerState', JSON.stringify(currentState));
        
        // Save current visible months configuration
        localStorage.setItem('billPlannerVisibleMonths', JSON.stringify(visibleMonths));
        
        // We don't save projections since they're calculated from bills
        
        console.log("Data saved to localStorage", {
            bills: billsToSave.length,
            state: currentState,
            visibleMonths: visibleMonths.length
        });
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
    }
}

// Fix loadDataFromStorage to properly handle loading saved data
function loadDataFromStorage() {
    try {
        console.group('Loading Data from Storage');
        
        const savedBills = localStorage.getItem('billPlannerData');
        const savedState = localStorage.getItem('billPlannerState');
        
        // Reset all data structures
        billsData = [];
        
        // Restore state if exists
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            currentState = loadedState;
            console.log('Restored state:', currentState);
        }
        
        // Update visible date range
        updateVisibleDateRange();
        
        // Load bills
        if (savedBills) {
            try {
                const parsedBills = JSON.parse(savedBills);
                billsData = parsedBills.map(bill => ({
                    ...bill,
                    dueDate: new Date(bill.dueDate)
                }));
                
                console.log('Loaded bills:', billsData);
            } catch (parseError) {
                console.error('Error parsing saved bills:', parseError);
                billsData = [];
            }
        }
        
        // Calculate projections
        recalculateYearlyProjections();
        
        // Update UI components
        updateDisplayedMonths();
        createMonthTabs();
        setupMonthTabListeners();
        initChart();
        updateMonthTabAmounts();
        updateMonthDisplay();
        updateBillsDisplay();
        
        console.groupEnd();
    } catch (error) {
        console.error('Error in loadDataFromStorage:', error);
        alert('There was an error loading your saved data. Starting with a clean slate.');
        
        // Reset to defaults
        billsData = [];
        const currentDate = new Date();
        currentState = {
            month: getMonthAbbreviation(currentDate.getMonth()),
            year: currentDate.getFullYear(),
            view: 'monthly'
        };
        updateVisibleDateRange();
        recalculateYearlyProjections();
    }
}

// Modify resetAllData to ensure clean slate
function resetAllData() {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        console.group('Resetting All Data');
        
        // Complete reset of all data structures
        billsData = [];
        monthlyProjections = {};
        
        // Reset to current date and monthly view
        const currentDate = new Date();
        currentState = {
            month: getMonthAbbreviation(currentDate.getMonth()),
            year: currentDate.getFullYear(),
            view: 'monthly'
        };
        
        // Update visible date range and initialize clean projections
        updateVisibleDateRange();
        initializeProjections();
        
        // Clear localStorage
        localStorage.removeItem('billPlannerData');
        localStorage.removeItem('billPlannerProjections');
        localStorage.removeItem('billPlannerState');
        
        // Update UI components
        updateDisplayedMonths();
        createMonthTabs();
        setupMonthTabListeners();
        initChart();
        updateMonthTabAmounts();
        updateMonthDisplay();
        updateBillsDisplay();
        
        console.log('Data reset complete');
        console.groupEnd();
        
        alert("All data has been reset");
    }
}

// Add initialization code to ensure console logs work
document.addEventListener('DOMContentLoaded', function() {
    // Enable verbose console logging
    debugLog('Bill Planner initialized');
    debugLog('Current date:', new Date());
    
    // Override console methods to ensure they display
    const originalLog = console.log;
    console.log = function() {
        const args = Array.from(arguments);
        setTimeout(originalLog.bind(console, ...args), 0);
    };
    
    const originalError = console.error;
    console.error = function() {
        const args = Array.from(arguments);
        setTimeout(originalError.bind(console, ...args), 0);
    };
    
    const originalWarn = console.warn;
    console.warn = function() {
        const args = Array.from(arguments);
        setTimeout(originalWarn.bind(console, ...args), 0);
    };
    
    const originalInfo = console.info;
    console.info = function() {
        const args = Array.from(arguments);
        setTimeout(originalInfo.bind(console, ...args), 0);
    };
    
    // Add global debugging function
    window.debugBillPlanner = function() {
        debugLog('Manual debug triggered');
        debugLog('Current state:', currentState);
        debugLog('Bills data:', billsData);
        debugLog('Monthly projections:', {...monthlyProjections});
        debugLog('Visible months:', visibleMonths);
        debugLog('Displayed months:', displayedMonths);
    };
    
    // Force recalculation on page load
    setTimeout(function() {
        recalculateYearlyProjections();
        updateMonthTabAmounts();
        updateMonthDisplay();
        updateBillsDisplay();
        updateChart();
    }, 1000);
});