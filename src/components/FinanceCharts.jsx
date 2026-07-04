import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

function FinanceCharts({ pieData, monthlyTrend, darkMode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className={`rounded-[2rem] border p-6 shadow-xl sm:p-8 lg:col-span-3 ${darkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Phân bổ chi tiêu</h3>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tỷ trọng chi tiêu theo danh mục</p>
          </div>
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
          <div>
            <h3 className="font-semibold">Xu hướng 6 tháng</h3>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Thu nhập và chi tiêu theo thời gian</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
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
  );
}

export default FinanceCharts;
