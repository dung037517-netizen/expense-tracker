import { useState } from "react";

function App() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const balance = income - expense;

  const handleSubmit = (event) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    setTransactions((previous) => [
      ...previous,
      {
        id: Date.now(),
        description: description.trim(),
        amount: parsedAmount,
        type,
      },
    ]);

    setDescription("");
    setAmount("");
    setType("expense");
  };

  const handleDelete = (id) => {
    setTransactions((previous) => previous.filter((transaction) => transaction.id !== id));
  };

  return (
    <div className="app-shell">
      <header className="header">
        <p className="eyebrow">Personal Finance</p>
        <h1>Expense Tracker</h1>
        <p className="subtitle">
          Track your income, expenses, and keep your balance under control.
        </p>
      </header>

      <section className="summary-grid" aria-label="Financial summary">
        <article className="card income-card">
          <p className="card-label">Income</p>
          <h2>${income.toLocaleString()}</h2>
        </article>
        <article className="card expense-card">
          <p className="card-label">Expense</p>
          <h2>${expense.toLocaleString()}</h2>
        </article>
        <article className="card balance-card">
          <p className="card-label">Balance</p>
          <h2>${balance.toLocaleString()}</h2>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Add a transaction</h2>
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

            <label>
              Type
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>

            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit">Add transaction</button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Recent transactions</h2>
            <span>{transactions.length} items</span>
          </div>

          <ul className="transaction-list">
            {transactions.map((transaction) => (
              <li key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div>
                  <p className="transaction-description">{transaction.description}</p>
                  <p className="transaction-meta">
                    {transaction.type === "income" ? "Income" : "Expense"}
                  </p>
                </div>
                <div className="transaction-actions">
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                  </span>
                  <button type="button" onClick={() => handleDelete(transaction.id)}>
                    Delete
                  </button>
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