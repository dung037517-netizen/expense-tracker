import { useState } from "react";

function App() {
  const [income, setIncome] = useState(5000);
  const [expense, setExpense] = useState(1200);

  const balance = income - expense;

  return (
    <div>
      <h1>Expense Tracker</h1>

      <h2>Income: ${income}</h2>

      <h2>Expense: ${expense}</h2>

      <h2>Balance: ${balance}</h2>
    </div>
  );
}

export default App;