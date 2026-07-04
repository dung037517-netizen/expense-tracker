import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Trash2, Download, Moon, Sun, PencilLine, RotateCcw, CheckCircle2, Sparkles, Target, Wallet2 } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
const STORAGE_KEYS = {
  transactions: 'financeflow-transactions',
  theme: 'financeflow-theme',
};

const buildSampleTransactions = () => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return [
    { id: 1, date: `${currentMonth}-03`, description: 'Salary', amount: 12000000, type: 'income', category: 'Salary' },
    { id: 2, date: `${currentMonth}-04`, description: 'Groceries', amount: 850000, type: 'expense', category: 'Food' },
    { id: 3, date: `${currentMonth}-06`, description: 'Bus Pass', amount: 320000, type: 'expense', category: 'Transport' },
    { id: 4, date: `${currentMonth}-08`, description: 'Freelance Project', amount: 3500000, type: 'income', category: 'Investment' },
    { id: 5, date: `${currentMonth}-09`, description: 'Study Materials', amount: 680000, type: 'expense', category: 'Study' },
  ];
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value);

function App() {
  const [transactions, setTransactions] = useState(() => {
    if (typeof window === 'undefined') return buildSampleTransactions();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEYS.transactions);
      if (saved === null) return buildSampleTransactions();
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : buildSampleTransactions();
    } catch {
      return buildSampleTransactions();
    }
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [highlightedId, setHighlightedId] = useState(null);

  const categories = ['Salary', 'Food', 'Transport', 'Rent', 'Study', 'Entertainment', 'Shopping', 'Investment', 'Others'];

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
    } catch {
      // Ignore storage write issues in restricted environments
    }
  }, [transactions]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.style.colorScheme = darkMode ? 'dark' : 'light';
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage write issues in restricted environments
    }
  }, [darkMode]);

  useEffect(() => {
    if (!toast.show) return;
    const timer = window.setTimeout(() => setToast({ show: false, message: '' }), 2200);
    return () => window.clearTimeout(timer);
  }, [toast.show]);

  useEffect(() => {
    if (!highlightedId) return;
    const timer = window.setTimeout(() => setHighlightedId(null), 900);
    return () => window.clearTimeout(timer);
  }, [highlightedId]);

  const filtered = transactions.filter((t) => t.date.startsWith(filterMonth));
  const income = filtered.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = filtered.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const monthlyBudgetLimit = Math.max(10000000, Math.round(income * 0.7));
  const budgetUsed = expense;
  const budgetHealth = monthlyBudgetLimit > 0 ? Math.min(100, Math.round((budgetUsed / monthlyBudgetLimit) * 100)) : 0;
  const budgetRemaining = monthlyBudgetLimit - budgetUsed;
  const healthStatus = budgetHealth < 60 ? 'Tốt' : budgetHealth < 85 ? 'Cảnh báo' : 'Nguy hiểm';

  const monthlySavingsGoal = Math.max(5000000, Math.round(income * 0.35));
  const savingsGoalProgress = Math.min(100, Math.round((balance / monthlySavingsGoal) * 100));
  const savingsGoalRemaining = Math.max(0, monthlySavingsGoal - balance);
  const goalStatus = balance >= monthlySavingsGoal ? 'Mục tiêu đã đạt 🎉' : `${formatCurrency(savingsGoalRemaining)} còn lại`;

  const insights = useMemo(() => {
    const list = [];
    if (savingsRate >= 20) list.push('Savings rate is strong and sustainable.');
    else list.push('Try trimming one non-essential spending category this month.');
    if (budgetHealth >= 85) list.push('You are close to your budget limit.');
    else if (budgetHealth >= 60) list.push('Spending is controlled and manageable.');
    else list.push('You are staying comfortably inside your budget.');
    if (balance >= 0) list.push('Your cash flow stays positive.');
    else list.push('A small adjustment could improve your balance.');
    return list;
  }, [savingsRate, budgetHealth, balance]);

  const pieData = useMemo(() => {
    const map = {};
    filtered.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - index);
      return date.toISOString().slice(0, 7);
    }).reverse();

    return months.map((month) => {
      const monthData = transactions.filter((t) => t.date.startsWith(month));
      return {
        month: format(new Date(`${month}-01`), 'MMM yy'),
        income: monthData.filter((t) => t.type === 'income').reduce((sum, item) => sum + item.amount, 0),
        expense: monthData.filter((t) => t.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
      };
    });
  }, [transactions]);

  const showToast = (message) => {
    setToast({ show: true, message });
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const resetForm = () => {
    setDesc('');
    setAmount('');
    setType('expense');
    setCategory('Food');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const submitTransaction = (e) => {
    e.preventDefault();
    if (!desc.trim() || !amount) {
      showToast('Vui lòng nhập mô tả và số tiền');
      return;
    }

    const newTransaction = {
      id: editingId || Date.now(),
      date: transactionDate,
      description: desc.trim(),
      amount: Number(amount),
      type,
      category,
    };

    if (editingId) {
      setTransactions((prev) => prev.map((item) => (item.id === editingId ? newTransaction : item)));
      showToast('Đã cập nhật giao dịch');
    } else {
      setTransactions((prev) => [newTransaction, ...prev]);
      setHighlightedId(newTransaction.id);
      showToast('Đã thêm giao dịch');
    }

    resetForm();
  };

  const deleteTrans = (id) => {
    if (confirm('Xóa giao dịch này?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Đã xóa giao dịch');
    }
  };

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setDesc(transaction.description);
    setAmount(transaction.amount);
    setType(transaction.type);
    setCategory(transaction.category);
    setTransactionDate(transaction.date);
    document.getElementById('add')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetAllData = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu?')) {
      setTransactions([]);
      resetForm();
      setFilterMonth(new Date().toISOString().slice(0, 7));
      showToast('Đã xóa toàn bộ dữ liệu');
    }
  };

  const loadDemoData = () => {
    setTransactions(buildSampleTransactions());
    setFilterMonth(new Date().toISOString().slice(0, 7));
    resetForm();
    showToast('Đã tải dữ liệu demo');
  };

  const exportCSV = () => {
    if (transactions.length === 0) {
      showToast('Không có dữ liệu để xuất');
      return;
    }
    const csv = 'Date,Description,Amount,Type,Category\n' + transactions.map((t) => `${t.date},${t.description},${t.amount},${t.type},${t.category}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finance-${filterMonth}.csv`;
    a.click();
    showToast('Đã xuất báo cáo CSV');
  };

  const exportJSON = () => {
    if (transactions.length === 0) {
      showToast('Không có dữ liệu để xuất');
      return;
    }
    const data = { transactions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `financeflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Đã xuất file JSON');
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          setFilterMonth(new Date().toISOString().slice(0, 7));
          resetForm();
          showToast('Import dữ liệu thành công');
        } else {
          showToast('File không hợp lệ');
        }
      } catch {
        showToast('File không hợp lệ');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-all duration-500 ${darkMode ? 'bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%),#020617] text-slate-100' : 'bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_28%),#f8fafc] text-slate-900'}`}>
      <header className={`relative overflow-hidden rounded-b-[3rem] border-b px-6 py-16 shadow-2xl ${darkMode ? 'border-emerald-400/20 bg-gradient-to-br from-emerald-950 via-slate-950 to-blue-950 text-white' : 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-slate-900'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_32%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${darkMode ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-white/70 text-emerald-700'}`}>
            <Sparkles size={16} /> Student-friendly finance dashboard
          </div>
          <h1 className="mb-4 mt-6 text-5xl font-black tracking-tight sm:text-6xl md:text-7xl">FinanceFlow</h1>
          <p className={`mb-4 text-2xl font-semibold sm:text-3xl ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>Personal Finance Dashboard</p>
          <p className={`mx-auto max-w-2xl text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Track income, expenses, and savings in one elegant place with a modern, portfolio-ready experience.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#add" className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white transition duration-200 hover:-translate-y-1 hover:bg-emerald-700">Thêm giao dịch ngay</a>
            <button type="button" onClick={exportCSV} className={`rounded-2xl border px-8 py-4 text-lg font-semibold transition duration-200 hover:-translate-y-1 ${darkMode ? 'border-white/40 bg-white/10 hover:bg-white/20' : 'border-slate-300 bg-white/80 hover:bg-white'}`} disabled={transactions.length === 0}>Export Report</button>
            <button type="button" onClick={exportJSON} className={`rounded-2xl px-5 py-3 font-semibold transition duration-200 hover:-translate-y-1 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-700'}`} disabled={transactions.length === 0}>Export JSON</button>
            <label className={`flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 font-semibold transition duration-200 hover:-translate-y-1 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
              Import JSON
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Personal Finance Dashboard • Built for clarity and future goals</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={loadDemoData} className={`rounded-full px-3 py-2 text-sm transition ${darkMode ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
              <span className="flex items-center gap-2"><Sparkles size={16} /> Demo Data</span>
            </button>
            <button type="button" onClick={resetAllData} className={`rounded-full px-3 py-2 text-sm transition ${darkMode ? 'bg-slate-800 text-amber-300 hover:bg-slate-700' : 'bg-slate-200 text-amber-700 hover:bg-slate-300'}`}>
              <span className="flex items-center gap-2"><RotateCcw size={16} /> Reset All</span>
            </button>
            <button type="button" onClick={toggleDarkMode} className={`rounded-full p-3 transition ${darkMode ? 'bg-slate-800 text-yellow-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`} aria-label="Toggle dark mode" aria-pressed={darkMode}>
              {darkMode ? <Sun /> : <Moon />}
            </button>
          </div>
        </div>

        <div className={`mb-10 rounded-[2rem] border p-6 shadow-xl sm:p-8 ${darkMode ? 'border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-800/80 to-slate-900' : 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50'}`}>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${darkMode ? 'bg-slate-700/70 text-emerald-200' : 'bg-white/80 text-emerald-700'}`}>
                <Sparkles size={16} /> Welcome to your money hub
              </div>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Your money becomes easier to understand when it is visual and consistent.</h2>
              <p className={`mt-3 max-w-xl text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>This dashboard helps students and young builders track spending, plan savings, and present a polished financial story for a college or scholarship application.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className={`rounded-2xl px-4 py-3 text-sm ${darkMode ? 'bg-slate-800/80 text-slate-200' : 'bg-white text-slate-700'}`}>
                  <span className="font-semibold">Focus:</span> build better habits
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm ${darkMode ? 'bg-slate-800/80 text-slate-200' : 'bg-white text-slate-700'}`}>
                  <span className="font-semibold">Goal:</span> save smarter each month
                </div>
              </div>
            </div>

            <div className={`rounded-[1.5rem] border p-6 ${darkMode ? 'border-emerald-400/20 bg-slate-900/70' : 'border-emerald-100 bg-white/90'}`}>
              <div className="flex items-center gap-2 text-emerald-500">
                <Target size={18} />
                <span className="font-semibold">Savings Goal</span>
              </div>
              <p className="mt-4 text-3xl font-semibold">{monthlySavingsGoal.toLocaleString()} đ</p>
              <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Monthly target for your future plans</p>
              <div className={`mt-4 h-3 overflow-hidden rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div className={`h-3 rounded-full transition-all duration-500 ${savingsGoalProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(6, savingsGoalProgress)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-medium">{savingsGoalProgress}% done</span>
                <span className={savingsGoalProgress >= 100 ? 'text-emerald-500' : 'text-amber-500'}>{goalStatus}</span>
              </div>
              <div className={`mt-4 flex items-center gap-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Wallet2 size={15} />
                You are building strong money habits.
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { title: 'Balance', value: balance, hint: 'Current net flow' },
            { title: 'Income', value: income, hint: 'Money flowing in' },
            { title: 'Expense', value: expense, hint: 'Money flowing out' },
            { title: 'Savings Rate', value: `${savingsRate}%`, hint: 'Efficiency of saving' },
          ].map((s, i) => (
            <div key={i} className={`rounded-[1.5rem] border p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.title}</p>
              <p className="mt-2 text-3xl font-bold">{typeof s.value === 'number' ? formatCurrency(s.value) : s.value}</p>
              <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.hint}</p>
            </div>
          ))}
        </div>

        <div className={`mb-10 rounded-[2rem] border p-6 shadow-xl sm:p-8 ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Budget overview</p>
              <h3 className="text-xl font-semibold">Budget Health</h3>
            </div>
            <div className={`rounded-full px-3 py-1 text-sm font-medium ${budgetHealth < 60 ? 'bg-emerald-500/10 text-emerald-500' : budgetHealth < 85 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
              {healthStatus}
            </div>
          </div>
          <div className={`h-3 overflow-hidden rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div className={`h-3 rounded-full transition-all duration-500 ${budgetHealth >= 85 ? 'bg-red-500' : budgetHealth >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, budgetHealth)}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{formatCurrency(budgetRemaining)} remaining</span>
            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Based on your current month</span>
          </div>
        </div>

        <div className={`mb-10 rounded-[2rem] border p-6 shadow-xl ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2 text-emerald-500">
            <Target size={18} />
            <h3 className="font-semibold">Smart insights</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {insights.map((item, index) => (
              <div key={index} className={`rounded-2xl p-4 text-sm ${darkMode ? 'bg-slate-700/80 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <form id="add" onSubmit={submitTransaction} className={`mb-10 grid grid-cols-1 gap-4 rounded-[2rem] border p-6 shadow-xl sm:p-8 lg:grid-cols-6 ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
          <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả" className={`rounded-2xl border p-4 lg:col-span-2 ${darkMode ? 'border-slate-700 bg-slate-700 text-white placeholder:text-slate-400' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} required />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Số tiền" className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-700 text-white placeholder:text-slate-400' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`} required />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="flex gap-2 lg:col-span-2">
            <button type="button" onClick={() => setType('income')} className={`flex-1 rounded-2xl py-4 font-semibold transition ${type === 'income' ? 'bg-emerald-600 text-white' : darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>Income</button>
            <button type="button" onClick={() => setType('expense')} className={`flex-1 rounded-2xl py-4 font-semibold transition ${type === 'expense' ? 'bg-rose-600 text-white' : darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>Expense</button>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-6">
            <button type="submit" className="flex-1 rounded-2xl bg-emerald-600 py-4 font-semibold text-white transition hover:bg-emerald-700">
              {editingId ? 'Cập nhật giao dịch' : 'Thêm giao dịch'}
            </button>
            <button type="button" onClick={resetForm} className={`rounded-2xl px-5 py-4 font-semibold transition ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              Hủy / Xóa form
            </button>
          </div>
        </form>

        <div className="mb-6 grid gap-6 lg:grid-cols-5">
          <div className={`rounded-[2rem] border p-6 shadow-xl sm:p-8 lg:col-span-3 ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-semibold">Phân bổ chi tiêu</h3>
              <div className={`rounded-full px-3 py-1 text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>Live view</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-[2rem] border p-6 shadow-xl sm:p-8 lg:col-span-2 ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-semibold">Lịch sử</h3>
              <button type="button" onClick={exportCSV} className="flex items-center gap-1 text-emerald-600" disabled={transactions.length === 0}><Download size={18} /> Export</button>
            </div>
            <div className="max-h-96 space-y-3 overflow-auto pr-2">
              {filtered.length === 0 ? (
                <div className={`rounded-2xl p-4 text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                  Chưa có giao dịch trong tháng này.
                </div>
              ) : filtered.map((t) => (
                <div key={t.id} className={`animate-pop flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between ${highlightedId === t.id ? 'ring-2 ring-emerald-400/70' : ''} ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.date} • {t.category}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className={t.type === 'income' ? 'font-bold text-emerald-500' : 'font-bold text-rose-500'}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => startEdit(t)} className="rounded-full p-2 text-blue-500 transition hover:bg-blue-500/10"><PencilLine size={16} /></button>
                      <button type="button" onClick={() => deleteTrans(t.id)} className="rounded-full p-2 text-rose-500 transition hover:bg-rose-500/10"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-[2rem] border p-6 shadow-xl sm:p-8 ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">Biểu đồ thu nhập & chi tiêu theo tháng</h3>
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={`rounded-2xl border px-4 py-2 ${darkMode ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <footer className="px-6 pb-8 pt-6 text-center text-sm text-slate-500">
        <p>Built with ❤️ by Mậu Dũng • FinanceFlow • {new Date().getFullYear()} • <a href="https://github.com/dung037517-netizen" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">GitHub</a></p>
      </footer>

      {toast.show ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 size={16} />
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

export default App;