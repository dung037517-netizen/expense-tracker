import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "expense-tracker-transactions";
const SETTINGS_KEY = "expense-tracker-settings";
const CATEGORY_OPTIONS = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Salary",
  "Freelance",
  "Other",
];

const initialTransactions = [
  { id: 1, description: "Salary", amount: 5000, type: "income", category: "Salary", date: "2026-07-01" },
  { id: 2, description: "Rent", amount: 1200, type: "expense", category: "Bills", date: "2026-07-02" },
  { id: 3, description: "Groceries", amount: 350, type: "expense", category: "Food", date: "2026-07-03" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

function App() {
  const [transactions, setTransactions] = useState(() => {
    if (typeof window === "undefined") {
      return initialTransactions;
    }

    const storedTransactions = window.localStorage.getItem(STORAGE_KEY);

    if (!storedTransactions) {
      return initialTransactions;
    }

    try {
      const parsed = JSON.parse(storedTransactions);
      return Array.isArray(parsed) ? parsed : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") {
      return { budget: 2500, darkMode: false };
    }

    const stored = window.localStorage.getItem(SETTINGS_KEY);

    if (!stored) {
      return { budget: 2500, darkMode: false };
    }

    try {
      const parsed = JSON.parse(stored);
      return { budget: parsed.budget ?? 2500, darkMode: parsed.darkMode ?? false };
    } catch {
      return { budget: 2500, darkMode: false };
    }
  });

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
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

  const income = useMemo(
    () => transactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions],
  );

  const expense = useMemo(
    () => transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions],
  );

  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthlyExpense = useMemo(
    () => transactions.filter((transaction) => transaction.type === "expense" && transaction.date.startsWith(currentMonthKey)).reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions, currentMonthKey],
  );

  const budgetProgress = settings.budget > 0 ? Math.min((monthlyExpense / settings.budget) * 100, 100) : 0;
  const budgetRemaining = settings.budget - monthlyExpense;

  const spendingByCategory = useMemo(() => {
    const currentMonthExpenses = transactions.filter(
      (transaction) => transaction.type === "expense" && transaction.date.startsWith(currentMonthKey),
    );

    return currentMonthExpenses.reduce((accumulator, transaction) => {
      const current = accumulator[transaction.category] ?? 0;
      accumulator[transaction.category] = current + transaction.amount;
      return accumulator;
    }, {});
  }, [transactions, currentMonthKey]);

  const topCategory = Object.entries(spendingByCategory).sort((a, b) => b[1] - a[1])[0];

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((transaction) => {
        const matchesSearch = transaction.description.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === "all" || transaction.type === filterType;
        const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, search, filterType, filterCategory]);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setType("expense");
    setCategory("Food");
    setDate(new Date().toISOString().slice(0, 10));
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
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expense-transactions.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Transactions exported.");
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
      <header className="header">
        <div className="header-top">
          <div>
            <p className="eyebrow">Personal Finance</p>
            <h1>Expense Tracker</h1>
            <p className="subtitle">
              Track income, control spending, and make smarter decisions every month.
            </p>
          </div>
          <button
            className="toggle-button"
            type="button"
            onClick={() => setSettings((previous) => ({ ...previous, darkMode: !previous.darkMode }))}
          >
            {settings.darkMode ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <section className="summary-grid" aria-label="Financial summary">
        <article className="card income-card">
          <p className="card-label">Income</p>
          <h2>{formatCurrency(income)}</h2>
        </article>
        <article className="card expense-card">
          <p className="card-label">Expense</p>
          <h2>{formatCurrency(expense)}</h2>
        </article>
        <article className="card balance-card">
          <p className="card-label">Balance</p>
          <h2>{formatCurrency(balance)}</h2>
        </article>
      </section>

      <section className="insight-grid">
        <article className="panel budget-card">
          <div className="panel-header">
            <h2>Monthly budget</h2>
            <span>{formatCurrency(monthlyExpense)} of {formatCurrency(settings.budget)}</span>
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
            <div style={{ width: `${budgetProgress}%` }} />
          </div>
          <p className="budget-caption">
            {budgetRemaining >= 0 ? `${formatCurrency(budgetRemaining)} left` : `${formatCurrency(Math.abs(budgetRemaining))} over budget`}
          </p>
        </article>

        <article className="panel insights-card">
          <h2>Smart insights</h2>
          <ul className="insight-list">
            <li>
              <strong>Savings rate:</strong> {savingsRate}%
            </li>
            <li>
              <strong>Top spending category:</strong> {topCategory ? `${topCategory[0]} (${formatCurrency(topCategory[1])})` : "No data yet"}
            </li>
            <li>
              <strong>Transactions tracked:</strong> {transactions.length}
            </li>
          </ul>
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
            <h2>Recent transactions</h2>
            <div className="panel-actions">
              <button className="secondary-button" type="button" onClick={handleExport}>
                Export
              </button>
              <label className="secondary-button import-label">
                Import
                <input type="file" accept="application/json" onChange={handleImport} />
              </label>
              <button className="danger-button" type="button" onClick={handleClearAll}>
                Clear
              </button>
            </div>
          </div>

          <div className="filters-grid">
            <input
              type="search"
              placeholder="Search transactions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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
                    {transaction.category} • {transaction.date}
                  </p>
                </div>
                <div className="transaction-actions">
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                  <div className="action-buttons">
                    <button type="button" onClick={() => handleEdit(transaction)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(transaction.id)}>
                      Delete
                    </button>
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