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

    if (tabName === 'analysis') {
        fetchAnalysis();
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
                fetchAnalysis();
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

// Fetch Analysis (Complex)
async function fetchAnalysis() {
    if (!userName) return;
    try {
        const response = await fetch(`/analysis/${encodeURIComponent(userName)}`);
        const data = await response.json();
        if (response.ok) {
            // Update Summary Cards
            document.getElementById('total-expenses').textContent = `₹${data.financials?.totalSpent?.toFixed(2) || 0}`;
            document.getElementById('active-loans-count').textContent = data.activeLoans || 0;
            document.getElementById('total-emi').textContent = `₹${data.totalMonthlyEmi || 0}`;

            // Update Budget Cards
            const fin = data.financials || {};
            document.getElementById('b-income').textContent = `₹${fin.income || 0}`;
            document.getElementById('b-limit').textContent = `₹${fin.budgetLimit || 0}`;
            document.getElementById('b-remaining').textContent = `₹${(fin.remainingBudget || 0).toFixed(2)}`;
            document.getElementById('b-spendable').textContent = `₹${(fin.spendableIncome || 0).toFixed(2)}`;

            // Render Loan Portfolio
            const list = document.getElementById('loan-list');
            list.innerHTML = "";
            if (data.loans && data.loans.length > 0) {
                data.loans.forEach(loan => {
                    const div = document.createElement('div');
                    div.className = 'loan-detail-card';
                    div.innerHTML = `
                        <div class="loan-header">
                            <h3>${loan.name}</h3>
                            <div class="action-buttons">
                                <button class="action-btn edit" onclick="editLoan(${loan.id}, '${loan.name}', ${loan.totalAmount}, ${loan.interest}, ${loan.tenure}, '${loan.startDate}')"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete" onclick="deleteLoan(${loan.id})"><i class="fas fa-trash"></i></button>
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
    const income = parseFloat(document.getElementById('set-income').value);
    const budget = parseFloat(document.getElementById('set-limit').value);
    const month = new Date().toISOString().slice(0, 7); // Current YYYY-MM

    if (isNaN(income) || isNaN(budget)) {
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
            fetchAnalysis(); // Refresh UI
        } else {
            showToast("Failed to update budget");
        }
    } catch (error) {
        showToast("Error connecting to server");
    }
}

// Init
document.getElementById('expense-date').valueAsDate = new Date();
openTab('analysis'); // Default
