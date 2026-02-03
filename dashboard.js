// Toast Function (Reused)
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.className = "toast show";
    toast.innerText = message;
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}

// User Management
const urlParams = new URLSearchParams(window.location.search);
const userName = urlParams.get('user');
let userId = null; // We need to fetch this or store it in storage. For now, we will query via name or just assume we have it. 
// Ideally, login return should give ID. I'll patch script.js to pass ID or fetch it.
// For this prototype, let's fetch user details by name if needed, or pass ID in URL.

if (userName) {
    document.getElementById('username').textContent = decodeURIComponent(userName);
}

function logout() {
    window.location.href = 'index.html';
}

// State for editing

let editingExpenseId = null;
let editingLoanId = null;
let editingIncomeId = null;

// Tab Switching
function openTab(tabName) {
    const tabContent = document.getElementsByClassName("tab-pane");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
        tabContent[i].classList.remove("active");
    }
    const tabBtn = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtn.length; i++) {
        tabBtn[i].classList.remove("active");
    }
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });

    if (tabName === 'overview') {
        fetchOverview();
    } else if (tabName === 'loan-analysis') {
        fetchLoanPortfolio();
    } else if (tabName === 'expenses') {
        fetchExpenses();
    } else if (tabName === 'incomes') {
        fetchIncomes();
    }
}

// Fetch Incomes List
async function fetchIncomes() {
    if (!userName) return;
    try {
        const response = await fetch(`/incomes/${encodeURIComponent(userName)}`);
        const data = await response.json();
        const list = document.getElementById('income-list');
        list.innerHTML = "";

        if (data.length > 0) {
            data.forEach(inc => {
                const div = document.createElement('div');
                div.className = 'expense-item'; // Reuse expense item style
                div.innerHTML = `
                    <div class="item-info">
                        <h4>${inc.source}</h4>
                        <span>${inc.date}</span>
                        <span>${inc.description}</span>
                    </div>
                    <div style="text-align: right;">
                        <div class="item-amount" style="color: #2ecc71;">₹${inc.amount}</div>
                        <div class="action-buttons">
                            <button class="action-btn edit" onclick="editIncome(${inc.id}, '${inc.amount}', '${inc.source}', '${inc.description}', '${inc.date}')"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" onclick="deleteIncome(${inc.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = "<p>No income recorded.</p>";
        }
    } catch (e) { console.log(e); }
}

// Add/Update Income
document.getElementById('incomeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userName) { showToast("User not found!"); return; }

    const amount = document.getElementById('income-amount').value;
    const source = document.getElementById('income-source').value;
    const description = document.getElementById('income-desc').value;
    const date = document.getElementById('income-date').value;

    const url = editingIncomeId ? `/incomes/${editingIncomeId}` : '/incomes';
    const method = editingIncomeId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: decodeURIComponent(userName), amount, source, description, date })
        });

        if (response.ok) {
            showToast(editingIncomeId ? 'Income Updated!' : 'Income Added!');
            resetIncomeForm();
            fetchIncomes();
        } else {
            showToast('Error saving income');
        }
    } catch (error) {
        showToast('Error connecting to server');
    }
});

function editIncome(id, amount, source, desc, date) {
    editingIncomeId = id;
    document.getElementById('income-amount').value = amount;
    document.getElementById('income-source').value = source;
    document.getElementById('income-desc').value = desc;
    document.getElementById('income-date').value = date;

    document.getElementById('income-submit-btn').textContent = "Update Income";
    document.getElementById('income-cancel-btn').style.display = "inline-block";
    window.scrollTo(0, 0);
}

function deleteIncome(id) {
    if (!confirm("Are you sure you want to delete this income?")) return;
    fetch(`/incomes/${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                showToast("Income deleted");
                fetchIncomes();
            }
        });
}

function resetIncomeForm() {
    document.getElementById('incomeForm').reset();
    document.getElementById('income-date').valueAsDate = new Date();
    editingIncomeId = null;
    document.getElementById('income-submit-btn').textContent = "Add Income";
    document.getElementById('income-cancel-btn').style.display = "none";
}

// Fetch Expenses List
async function fetchExpenses() {
    if (!userName) return;
    try {
        const response = await fetch(`/expenses/${encodeURIComponent(userName)}`);
        const data = await response.json();
        const list = document.getElementById('expense-list');
        list.innerHTML = "";

        if (data.length > 0) {
            data.forEach(exp => {
                const div = document.createElement('div');
                div.className = 'expense-item';
                div.innerHTML = `
                    <div class="item-info">
                        <h4>${exp.category}</h4>
                        <span>${exp.date}</span>
                        <span>${exp.description}</span>
                    </div>
                    <div style="text-align: right;">
                        <div class="item-amount">₹${exp.amount}</div>
                        <div class="action-buttons">
                            <button class="action-btn edit" onclick="editExpense(${exp.id}, '${exp.amount}', '${exp.category}', '${exp.description}', '${exp.date}')"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" onclick="deleteExpense(${exp.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = "<p>No expenses recorded.</p>";
        }
    } catch (e) { console.log(e); }
}

// Add/Update Expense
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userName) { showToast("User not found!"); return; }

    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-desc').value;
    const date = document.getElementById('expense-date').value;

    const url = editingExpenseId ? `/expenses/${editingExpenseId}` : '/expenses';
    const method = editingExpenseId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: decodeURIComponent(userName), amount, category, description, date })
        });

        if (response.ok) {
            showToast(editingExpenseId ? 'Expense Updated!' : 'Expense Added!');
            resetExpenseForm();
            fetchExpenses();
        } else {
            showToast('Error saving expense');
        }
    } catch (error) {
        showToast('Error connecting to server');
    }
});

function editExpense(id, amount, category, desc, date) {
    editingExpenseId = id;
    document.getElementById('expense-amount').value = amount;
    document.getElementById('expense-category').value = category;
    document.getElementById('expense-desc').value = desc;
    document.getElementById('expense-date').value = date;

    document.getElementById('expense-submit-btn').textContent = "Update Expense";
    document.getElementById('expense-cancel-btn').style.display = "inline-block";
    window.scrollTo(0, 0);
}

function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    fetch(`/expenses/${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                showToast("Expense deleted");
                fetchExpenses();
            }
        });
}

function resetExpenseForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expense-date').valueAsDate = new Date();
    editingExpenseId = null;
    document.getElementById('expense-submit-btn').textContent = "Add Expense";
    document.getElementById('expense-cancel-btn').style.display = "none";
}

// Handle Expense CSV Upload
function handleExpenseCSV(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        const text = e.target.result;
        const rows = text.split('\n');
        const expenses = [];

        // Assume simple CSV: Amount, Category, Description, Date (YYYY-MM-DD)
        // Skip header if first row contains "Amount"
        let startIndex = 0;
        if (rows[0].toLowerCase().includes('amount')) startIndex = 1;

        for (let i = startIndex; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length < 4) continue; // Skip invalid rows

            const amount = parseFloat(cols[0].trim());
            const category = cols[1].trim();
            const description = cols[2].trim();
            let date = cols[3].trim(); // Verify YYYY-MM-DD?

            if (!amount || isNaN(amount)) continue;

            expenses.push({ amount, category, description, date });
        }

        if (expenses.length === 0) {
            showToast("No valid expenses found in CSV.");
            return;
        }

        if (!confirm(`Found ${expenses.length} expenses. Upload now?`)) return;

        try {
            const response = await fetch('/expenses/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: decodeURIComponent(userName), expenses })
            });

            const resData = await response.json();
            if (response.ok) {
                showToast(resData.message);
                fetchExpenses(); // Refresh list
                input.value = ''; // Reset input
            } else {
                showToast("Upload failed: " + resData.error);
            }
        } catch (err) {
            console.error(err);
            showToast("Error uploading expenses.");
        }
    };
    reader.readAsText(file);
}

// Add/Update Loan
document.getElementById('loanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userName) { showToast("User not found!"); return; }

    const name = document.getElementById('loan-name').value;
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const interest = parseFloat(document.getElementById('loan-interest').value);
    const tenure = parseFloat(document.getElementById('loan-tenure').value);
    const date = document.getElementById('loan-date').value;

    const r = interest / 12 / 100;
    const emi = (amount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);

    document.getElementById('display-emi').textContent = `₹${emi.toFixed(2)}`;
    document.getElementById('loan-result').classList.remove('hidden');

    const url = editingLoanId ? `/loans/${editingLoanId}` : '/loans';
    const method = editingLoanId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: decodeURIComponent(userName), name, amount, interest, tenure, emi: emi.toFixed(2), start_date: date })
        });
        if (response.ok) {
            showToast(editingLoanId ? 'Loan Updated!' : 'Loan Added!');
            resetLoanForm();
            // If we are in loans tab, we might want to stay here, but analysis has the list.
            // Maybe notify user to check analysis? Or just reset.
        }
    } catch (error) { showToast('Error saving loan'); }
});

function editLoan(id, name, amount, interest, tenure, date) {
    editingLoanId = id;
    document.getElementById('loan-name').value = name;
    document.getElementById('loan-amount').value = amount;
    document.getElementById('loan-interest').value = interest;
    document.getElementById('loan-tenure').value = tenure;
    document.getElementById('loan-date').value = date; // Note: server needs to return start_date in /analysis

    document.getElementById('loan-submit-btn').textContent = "Update Loan";
    document.getElementById('loan-cancel-btn').style.display = "inline-block";

    // Switch to Add Loan tab
    openTab('loans');
}

function deleteLoan(id) {
    if (!confirm("Are you sure you want to delete this loan?")) return;
    fetch(`/loans/${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                showToast("Loan deleted");
                fetchLoanPortfolio();
            }
        });
}

function resetLoanForm() {
    document.getElementById('loanForm').reset();
    editingLoanId = null;
    document.getElementById('loan-submit-btn').textContent = "Calculate & Add Loan";
    document.getElementById('loan-cancel-btn').style.display = "none";
    document.getElementById('loan-result').classList.add('hidden');
}

function cancelEdit(type) {
    if (type === 'expense') resetExpenseForm();
    if (type === 'expense') resetExpenseForm();
    if (type === 'loan') resetLoanForm();
    if (type === 'income') resetIncomeForm();
}

// Preclose Loan
function precloseLoan(id, name) {
    if (!confirm(`Are you sure you want to PRECLOSE the loan for ${name}?\nThis will mark it as paid and remove it from your active list.`)) return;

    fetch(`/loans/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Closed' })
    })
        .then(res => res.json())
        .then(data => {
            showToast(data.message);
            fetchLoanPortfolio(); // Refresh list
        })
        .catch(err => showToast("Error updating loan status"));
}

// Fetch Overview Data (Financials + Recent Expenses)
async function fetchOverview() {
    if (!userName) return;
    try {
        // 1. Fetch Financial Stats
        const response = await fetch(`/analysis/${encodeURIComponent(userName)}`);
        const data = await response.json();
        if (response.ok) {
            const fin = data.financials || {};
            document.getElementById('b-income').textContent = `₹${fin.income || 0}`;
            document.getElementById('b-limit').textContent = `₹${fin.budgetLimit || 0}`;
            document.getElementById('total-expenses').textContent = `₹${fin.totalSpent?.toFixed(2) || 0}`;
            document.getElementById('b-spendable').textContent = `₹${(fin.spendableIncome || 0).toFixed(2)}`;
        }

        // 2. Fetch Recent Expenses (Top 5)
        const expResponse = await fetch(`/expenses/${encodeURIComponent(userName)}`);
        const expenses = await expResponse.json();
        const list = document.getElementById('overview-expenses-list');
        list.innerHTML = "";

        if (expenses.length > 0) {
            expenses.slice(0, 5).forEach(exp => {
                const div = document.createElement('div');
                div.className = 'expense-item';
                div.innerHTML = `
                    <div class="item-info">
                        <h4>${exp.category}</h4>
                        <span style="font-size: 0.8em; color: #888;">${exp.date}</span>
                    </div>
                    <div style="text-align: right;">
                        <div class="item-amount">₹${exp.amount}</div>
                    </div>
                `;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = "<p style='text-align:center; padding: 20px; color:#666;'>No recent expenses.</p>";
        }

    } catch (error) { console.log(error); }
}

// Fetch Loan Portfolio
async function fetchLoanPortfolio() {
    if (!userName) return;
    try {
        const response = await fetch(`/analysis/${encodeURIComponent(userName)}`);
        const data = await response.json();
        if (response.ok) {
            // Update Stats
            document.getElementById('active-loans-count').textContent = data.activeLoans || 0;
            document.getElementById('total-emi').textContent = `₹${data.totalMonthlyEmi || 0}`;

            // Calculate Total Debt
            let totalDebt = 0;
            if (data.loans) {
                totalDebt = data.loans.reduce((sum, loan) => sum + parseFloat(loan.principalRemaining), 0);
            }
            document.getElementById('total-debt').textContent = `₹${totalDebt.toFixed(2)}`;

            // Render Loan List
            const list = document.getElementById('loan-list');
            list.innerHTML = "";
            let loans = data.loans || [];

            // Sorting Logic
            const sortValue = document.getElementById('loan-sort')?.value || 'default';
            if (sortValue === 'tenure-asc') {
                loans.sort((a, b) => (a.tenure - a.monthsPaid) - (b.tenure - b.monthsPaid)); // Remaining Tenure Low to High
            } else if (sortValue === 'tenure-desc') {
                loans.sort((a, b) => (b.tenure - b.monthsPaid) - (a.tenure - a.monthsPaid)); // Remaining Tenure High to Low
            } else if (sortValue === 'amount-desc') {
                loans.sort((a, b) => parseFloat(b.principalRemaining) - parseFloat(a.principalRemaining));
            } else if (sortValue === 'amount-asc') {
                loans.sort((a, b) => parseFloat(a.principalRemaining) - parseFloat(b.principalRemaining));
            }

            if (loans.length > 0) {
                loans.forEach(loan => {
                    const div = document.createElement('div');
                    div.className = 'loan-detail-card';
                    div.innerHTML = `
                        <div class="loan-header">
                            <h3>${loan.name}</h3>
                            <div class="action-buttons">
                                <button class="action-btn edit" onclick="editLoan(${loan.id}, '${loan.name}', ${loan.totalAmount}, ${loan.interest}, ${loan.tenure}, '${loan.startDate}')"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete" onclick="deleteLoan(${loan.id})"><i class="fas fa-trash"></i></button>
                                <button class="action-btn" onclick="precloseLoan(${loan.id}, '${loan.name}')" title="Preclose Loan" style="color: #27ae60;"><i class="fas fa-check-circle"></i></button>
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #ccc; margin-bottom: 5px;">${loan.completion}% Paid</div>
                        <div class="loan-stats">
                            <div>Total Loan<span>₹${loan.totalAmount}</span></div>
                            <div>EMI<span>₹${loan.emi}</span></div>
                            <div>Paid (Interest)<span>₹${loan.interestPaid}</span></div>
                            <div>Paid (Principal)<span>₹${loan.principalPaid}</span></div>
                            <div>Remaining<span>₹${loan.principalRemaining}</span></div>
                            <div>Tenure<span>${loan.monthsPaid} / ${loan.tenure} Months</span></div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${loan.completion}%"></div>
                        </div>
                    `;
                    list.appendChild(div);
                });
            } else {
                list.innerHTML = "<p>No active loans found.</p>";
            }
        }
    } catch (error) { console.log(error); }
}


// Budget Modal Logic
function toggleBudgetModal() {
    const modal = document.getElementById('budget-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        // Pre-fill if data exists
        const limitText = document.getElementById('b-limit').textContent.replace('₹', '');
        // document.getElementById('set-income').value = parseFloat(incomeText) || ''; // Removed manual income
        document.getElementById('set-limit').value = parseFloat(limitText) || '';
    } else {
        modal.classList.add('hidden');
    }
}

async function saveBudget() {
    if (!userName) return;
    // const income = parseFloat(document.getElementById('set-income').value);
    const budget = parseFloat(document.getElementById('set-limit').value);
    const month = new Date().toISOString().slice(0, 7); // Current YYYY-MM

    if (isNaN(budget)) { // Removed income check
        showToast("Please enter valid numbers");
        return;
    }

    try {
        const response = await fetch('/financials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: decodeURIComponent(userName), income: 0, budget, month }) // Set income to 0 as it's calculated
        });

        if (response.ok) {
            showToast("Budget updated successfully!");
            toggleBudgetModal();
            fetchOverview(); // Refresh UI
        } else {
            showToast("Failed to update budget");
        }
    } catch (error) {
        showToast("Error connecting to server");
    }
}

// Init
document.getElementById('expense-date').valueAsDate = new Date();
openTab('overview'); // Default
