import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const STORAGE_KEY = "finance-dashboard-transactions";
const SETTINGS_KEY = "finance-dashboard-settings";
const BUDGETS_KEY = "finance-dashboard-budgets";
const GOAL_KEY = "finance-dashboard-goal";
const CATEGORY_OPTIONS = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

const buildInitialTransactions = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  const currentDate = `${year}-${month}-${day}`;

  return [
    { id: 1, description: "Salary", amount: 6500, type: "income", category: "Salary", date: currentDate, recurring: false },
    { id: 2, description: "Rent", amount: 1400, type: "expense", category: "Bills", date: currentDate, recurring: true },
    { id: 3, description: "Groceries", amount: 320, type: "expense", category: "Food", date: currentDate, recurring: false },
  ];
};

const buildDefaultBudgets = () => ({
  Food: 600,
  Transport: 220,
  Bills: 1000,
  Shopping: 300,
  Health: 220,
  Entertainment: 180,
  Other: 150,
});

const buildDefaultGoal = () => ({ label: "Emergency fund", target: 12000 });

const formatCurrency = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

function App() {
  const [transactions, setTransactions] = useState(() => {
    if (typeof window === "undefined") {
      return buildInitialTransactions();
    }

    const storedTransactions = window.localStorage.getItem(STORAGE_KEY);
    if (!storedTransactions) {
      return buildInitialTransactions();
    }

    try {
      const parsed = JSON.parse(storedTransactions);
      return Array.isArray(parsed) ? parsed : buildInitialTransactions();
    } catch {
      return buildInitialTransactions();
    }
  });

  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") {
      return { budget: 3200, darkMode: false, currency: "USD" };
    }

    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return { budget: 3200, darkMode: false, currency: "USD" };
    }

    try {
      const parsed = JSON.parse(stored);
      return { budget: parsed.budget ?? 3200, darkMode: parsed.darkMode ?? false, currency: parsed.currency ?? "USD" };
    } catch {
      return { budget: 3200, darkMode: false, currency: "USD" };
    }
  });

  const [budgets, setBudgets] = useState(() => {
    if (typeof window === "undefined") {
      return buildDefaultBudgets();
    }

    const stored = window.localStorage.getItem(BUDGETS_KEY);
    if (!stored) {
      return buildDefaultBudgets();
    }

    try {
      const parsed = JSON.parse(stored);
      return { ...buildDefaultBudgets(), ...parsed };
    } catch {
      return buildDefaultBudgets();
    }
  });

  const [goal, setGoal] = useState(() => {
    if (typeof window === "undefined") {
      return buildDefaultGoal();
    }

    const stored = window.localStorage.getItem(GOAL_KEY);
    if (!stored) {
      return buildDefaultGoal();
    }

    try {
      const parsed = JSON.parse(stored);
      return { label: parsed.label ?? buildDefaultGoal().label, target: Number(parsed.target) || buildDefaultGoal().target };
    } catch {
      return buildDefaultGoal();
    }
  });

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    }
  }, [budgets]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
    }
  }, [goal]);

  const monthOptions = useMemo(() => {
    const months = new Set(transactions.map((transaction) => transaction.date.slice(0, 7)));
    const current = new Date().toISOString().slice(0, 7);
    months.add(current);
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((transaction) => {
        const matchesMonth = filterMonth ? transaction.date.startsWith(filterMonth) : true;
        const matchesSearch = transaction.description.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === "all" || transaction.type === filterType;
        const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
        return matchesMonth && matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterMonth, search, filterType, filterCategory]);

  const monthlyTransactions = useMemo(() => filteredTransactions, [filteredTransactions]);

  const income = useMemo(
    () => monthlyTransactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthlyTransactions],
  );

  const expense = useMemo(
    () => monthlyTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthlyTransactions],
  );

  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  const monthlyNet = balance;
  const projectedBalance = balance + monthlyNet * 3;

  const categorySpending = useMemo(() => {
    const grouped = monthlyTransactions.filter((transaction) => transaction.type === "expense").reduce((accumulator, transaction) => {
      const current = accumulator[transaction.category] ?? 0;
      accumulator[transaction.category] = current + transaction.amount;
      return accumulator;
    }, {});

    return Object.entries(budgets)
      .map(([name, limit]) => ({
        name,
        spend: grouped[name] ?? 0,
        limit,
        ratio: limit > 0 ? Math.min(((grouped[name] ?? 0) / limit) * 100, 100) : 0,
      }))
      .filter((entry) => entry.spend > 0 || entry.limit > 0);
  }, [budgets, monthlyTransactions]);

  const expenseBreakdown = useMemo(() => {
    return categorySpending
      .filter((entry) => entry.spend > 0)
      .map((entry) => ({ name: entry.name, value: entry.spend }));
  }, [categorySpending]);

  const monthlyTrend = useMemo(() => {
    const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - index);
      return date.toISOString().slice(0, 7);
    }).reverse();

    return lastSixMonths.map((month) => {
      const monthData = transactions.filter((transaction) => transaction.date.startsWith(month));
      return {
        month,
        income: monthData.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0),
        expense: monthData.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0),
      };
    });
  }, [transactions]);

  const recurringCount = transactions.filter((transaction) => transaction.recurring).length;
  const topCategory = expenseBreakdown.sort((a, b) => b.value - a.value)[0];
  const budgetHealth = expense > settings.budget ? "At risk" : expense / Math.max(settings.budget, 1) > 0.8 ? "Watch" : "Healthy";
  const goalProgress = goal.target > 0 ? Math.min((balance / goal.target) * 100, 100) : 0;
  const statusMessage = expense > settings.budget * 0.9 ? "Spending is approaching your monthly cap." : balance > 0 ? "Your cash flow is healthy and growing." : "Review spending to restore balance.";

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setType("expense");
    setCategory("Food");
    setDate(new Date().toISOString().slice(0, 10));
    setRecurring(false);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    const transactionPayload = {
      id: editingId ?? Date.now(),
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      date,
      recurring,
    };

    if (editingId) {
      setTransactions((previous) => previous.map((transaction) => (transaction.id === editingId ? transactionPayload : transaction)));
      setMessage("Transaction updated successfully.");
    } else {
      setTransactions((previous) => [transactionPayload, ...previous]);
      setMessage("Transaction added successfully.");
    }

    resetForm();
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setDescription(transaction.description);
    setAmount(transaction.amount);
    setType(transaction.type);
    setCategory(transaction.category);
    setDate(transaction.date);
    setRecurring(Boolean(transaction.recurring));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setTransactions((previous) => previous.filter((transaction) => transaction.id !== id));
    setMessage("Transaction deleted.");
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all transactions?")) {
      setTransactions([]);
      setMessage("All transactions were cleared.");
    }
  };

  const handleExport = () => {
    const header = ["date", "description", "amount", "type", "category", "recurring"];
    const rows = transactions.map((transaction) => [transaction.date, transaction.description, transaction.amount, transaction.type, transaction.category, Boolean(transaction.recurring)]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "finance-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("CSV exported successfully.");
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadedEvent) => {
      try {
        const imported = JSON.parse(loadedEvent.target?.result ?? "[]");
        if (!Array.isArray(imported)) {
          throw new Error("Invalid data");
        }

        const normalized = imported.map((transaction) => ({
          id: transaction.id ?? Date.now() + Math.random(),
          description: transaction.description ?? "Imported",
          amount: Number(transaction.amount) || 0,
          type: transaction.type === "income" ? "income" : "expense",
          category: transaction.category ?? "Other",
          date: transaction.date ?? new Date().toISOString().slice(0, 10),
          recurring: Boolean(transaction.recurring),
        }));

        setTransactions(normalized);
        setMessage("Transactions imported successfully.");
      } catch {
        setMessage("Unable to import file. Please use a valid JSON export.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className={`app-shell ${settings.darkMode ? "dark" : ""}`}>
      <header className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Finance Dashboard • Portfolio Ready</p>
          <h1>Personal Finance Intelligence</h1>
          <p className="subtitle">
            A professional dashboard for tracking cash flow, budget discipline, forecasting, and financial decision-making.
          </p>
        </div>
        <div className="hero-actions">
          <label className="mini-select">
            Currency
            <select value={settings.currency} onChange={(event) => setSettings((previous) => ({ ...previous, currency: event.target.value }))}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="VND">VND</option>
            </select>
          </label>
          <button className="toggle-button" type="button" onClick={() => setSettings((previous) => ({ ...previous, darkMode: !previous.darkMode }))}>
            {settings.darkMode ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <section className="summary-grid" aria-label="Financial summary">
        <article className="card income-card">
          <p className="card-label">Monthly income</p>
          <h2>{formatCurrency(income, settings.currency)}</h2>
        </article>
        <article className="card expense-card">
          <p className="card-label">Monthly expense</p>
          <h2>{formatCurrency(expense, settings.currency)}</h2>
        </article>
        <article className="card balance-card">
          <p className="card-label">Net balance</p>
          <h2>{formatCurrency(balance, settings.currency)}</h2>
        </article>
        <article className="card insight-card">
          <p className="card-label">Savings rate</p>
          <h2>{savingsRate}%</h2>
        </article>
      </section>

      <section className="insight-grid">
        <article className="panel budget-card">
          <div className="panel-header">
            <h2>Budget control</h2>
            <span className={`status-pill ${budgetHealth.toLowerCase()}`}>{budgetHealth}</span>
          </div>
          <label className="budget-input">
            Monthly limit
            <input
              type="number"
              min="0"
              value={settings.budget}
              onChange={(event) => setSettings((previous) => ({ ...previous, budget: Number(event.target.value) || 0 }))}
            />
          </label>
          <div className="progress-bar" aria-label="Budget progress">
            <div style={{ width: `${Math.min((expense / Math.max(settings.budget, 1)) * 100, 100)}%` }} />
          </div>
          <p className="budget-caption">
            {expense <= settings.budget ? `${formatCurrency(settings.budget - expense, settings.currency)} remaining` : `${formatCurrency(expense - settings.budget, settings.currency)} over plan`}
          </p>
        </article>

        <article className="panel insights-card">
          <h2>Financial intelligence</h2>
          <ul className="insight-list">
            <li><strong>Forecast 3 months:</strong> {formatCurrency(projectedBalance, settings.currency)}</li>
            <li><strong>Top category:</strong> {topCategory ? `${topCategory.name} (${formatCurrency(topCategory.value, settings.currency)})` : "No data yet"}</li>
            <li><strong>Recurring transactions:</strong> {recurringCount}</li>
            <li><strong>Signal:</strong> {statusMessage}</li>
          </ul>
        </article>
      </section>

      <section className="chart-grid">
        <article className="panel">
          <h2>Spending breakdown</h2>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"][index % 6]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value, settings.currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <h2>Cash flow trend</h2>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value, settings.currency)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="goal-grid">
        <article className="panel goal-card">
          <div className="panel-header">
            <h2>Savings goal</h2>
            <span>{formatCurrency(goal.target, settings.currency)}</span>
          </div>
          <label className="budget-input">
            Goal target
            <input
              type="number"
              min="0"
              value={goal.target}
              onChange={(event) => setGoal((previous) => ({ ...previous, target: Number(event.target.value) || 0 }))}
            />
          </label>
          <label className="budget-input">
            Goal label
            <input
              type="text"
              value={goal.label}
              onChange={(event) => setGoal((previous) => ({ ...previous, label: event.target.value }))}
            />
          </label>
          <div className="progress-bar" aria-label="Goal progress">
            <div style={{ width: `${goalProgress}%` }} />
          </div>
          <p className="budget-caption">{goal.label} • {Math.round(goalProgress)}% funded</p>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Category budgets</h2>
          </div>
          <div className="budget-list">
            {categorySpending.map((entry) => (
              <div key={entry.name} className="budget-item">
                <div className="budget-item-header">
                  <strong>{entry.name}</strong>
                  <span>{formatCurrency(entry.spend, settings.currency)} / {formatCurrency(entry.limit, settings.currency)}</span>
                </div>
                <div className="progress-bar small-bar">
                  <div style={{ width: `${entry.ratio}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>{editingId ? "Edit transaction" : "Add a transaction"}</h2>
          <form className="transaction-form" onSubmit={handleSubmit}>
            <label>
              Description
              <input
                type="text"
                placeholder="e.g. Freelance project"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

            <div className="form-row">
              <label>
                Type
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>

              <label>
                Category
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>

            <label className="checkbox-row">
              <input type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} />
              Recurring monthly
            </label>

            {error ? <p className="form-error">{error}</p> : null}
            {message ? <p className="form-message">{message}</p> : null}

            <div className="button-row">
              <button type="submit">{editingId ? "Save changes" : "Add transaction"}</button>
              {editingId ? (
                <button className="secondary-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Transaction ledger</h2>
            <div className="panel-actions">
              <button className="secondary-button" type="button" onClick={handleExport}>Export CSV</button>
              <label className="secondary-button import-label">
                Import JSON
                <input type="file" accept="application/json" onChange={handleImport} />
              </label>
              <button className="danger-button" type="button" onClick={handleClearAll}>Reset</button>
            </div>
          </div>

          <div className="filters-grid">
            <select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)}>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <input type="search" placeholder="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
              <option value="all">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <ul className="transaction-list">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div>
                  <p className="transaction-description">{transaction.description}</p>
                  <p className="transaction-meta">
                    {transaction.category} • {transaction.date} {transaction.recurring ? "• Recurring" : ""}
                  </p>
                </div>
                <div className="transaction-actions">
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount, settings.currency)}
                  </span>
                  <div className="action-buttons">
                    <button type="button" onClick={() => handleEdit(transaction)}>Edit</button>
                    <button type="button" onClick={() => handleDelete(transaction.id)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default App;