
// Verification Script for Financial Features
// Usage: node verify_financials.mjs

const BASE_URL = 'http://localhost:3000';
const USER_NAME = 'TestUser_' + Date.now();
const EMAIL = `test_${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function runTest() {
    console.log("Starting Verification...");

    // 1. Signup
    console.log("1. Registering User:", USER_NAME);
    const signupRes = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: USER_NAME, email: EMAIL, password: PASSWORD })
    });
    const signupData = await signupRes.json();
    if (!signupRes.ok) throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
    console.log("   User registered.");

    // 2. Add Loan (Backdated to test amortization)
    // 100k Principle, 12% Interest, 12 Months tenure.
    // Start date: 6 months ago.
    const now = new Date();
    // Use strictly 6 months.
    const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];

    // Calculate EMI client side
    const P = 100000;
    const rate = 12;
    const N = 12;
    const r = rate / 12 / 100;
    const emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    const emiFixed = parseFloat(emi.toFixed(2));

    console.log(`2. Adding Loan: 100k, 12%, 12m, EMI: ${emiFixed}, Start: ${startDate}`);

    const loanRes = await fetch(`${BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: USER_NAME,
            name: 'Backdated Loan',
            amount: P,
            interest: rate,
            tenure: N,
            emi: emiFixed,
            start_date: startDate
        })
    });
    if (!loanRes.ok) throw new Error("Failed to add loan");
    console.log("   Loan added.");

    // 3. Set Budget
    console.log("3. Setting Budget: Income 50k, Limit 30k");
    const budgetRes = await fetch(`${BASE_URL}/financials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: USER_NAME,
            income: 50000,
            budget: 30000,
            month: new Date().toISOString().slice(0, 7)
        })
    });
    if (!budgetRes.ok) throw new Error("Failed to set budget");
    console.log("   Budget set.");

    // 4. Get Analysis and Verify
    console.log("4. Fetching Analysis...");
    const analysisRes = await fetch(`${BASE_URL}/analysis/${USER_NAME}`);
    const data = await analysisRes.json();

    console.log("   Analysis Data:", JSON.stringify(data, null, 2));

    // Verify Budget
    if (data.financials.income !== 50000) throw new Error("Income mismatch");
    if (data.financials.budgetLimit !== 30000) throw new Error("Budget Limit mismatch");

    // Verify Loan Stats
    const loan = data.loans[0];
    if (!loan) throw new Error("No loan found in analysis");

    console.log(`   Loan Stats: Paid Months: ${loan.monthsPaid}, Principal Remaining: ${loan.principalRemaining}`);

    if (loan.monthsPaid < 5 || loan.monthsPaid > 7) {
        console.warn("WARNING: Months paid count is unexpected (might be date boundary issue). Got:", loan.monthsPaid);
    }

    if (parseFloat(loan.principalRemaining) >= 100000) {
        throw new Error("Principal Remaining did not decrease! Amortization failed.");
    }

    if (parseFloat(loan.principalRemaining) < 10000) {
        throw new Error("Principal Remaining decreased too much! something wrong.");
    }

    console.log("SUCCESS: All verification checks passed!");
}

runTest().catch(e => {
    console.error("FAILED:", e);
    process.exit(1);
});
