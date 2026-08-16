/**
 * @file Dashboard.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description لوحة القيادة التنفيذية (Executive BI Dashboard) - نظام MARO ERP.
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Package, ShoppingCart, 
  Activity, ArrowUpRight, ArrowDownRight, ShieldCheck, FileText, Users, Plus, BarChart3, Calendar, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';

// بيانات تجريبية (يتم استبدالها لاحقاً ببيانات حقيقية من CQRS/Repositories)
const salesData = [
  { name: 'يناير', sales: 4000, profit: 2400 },
  { name: 'فبراير', sales: 3000, profit: 1398 },
  { name: 'مارس', sales: 2000, profit: 9800 },
  { name: 'أبريل', sales: 2780, profit: 3908 },
  { name: 'مايو', sales: 1890, profit: 4800 },
  { name: 'يونيو', sales: 2390, profit: 3800 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: 'blue' | 'red' | 'green' | 'amber' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] shadow-xl hover:bg-[#1a2133] transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider transition-colors",
          trend === 'up' ? "bg-green-500/10 text-green-500 group-hover:bg-green-500/20" : "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
        )}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
        <div className={cn("p-3 rounded-xl border transition-colors", colorClasses[color])}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-slate-500 text-xs font-medium mb-1 text-right">{title}</p>
      <h4 className="text-2xl font-bold text-white text-right">{value}</h4>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">لوحة القيادة التنفيذية</h1>
        <div className="bg-[#1e293b] px-4 py-2 rounded-xl text-xs font-bold text-slate-300">
          آخر تحديث: الآن
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="إجمالي المبيعات" value="1,250,000" change="+12.5%" trend="up" icon={DollarSign} color="green" />
        <StatCard title="إجمالي المشتريات" value="850,000" change="-2.4%" trend="down" icon={ShoppingCart} color="blue" />
        <StatCard title="الأصناف منخفضة المخزون" value="42" change="تنبيه" trend="down" icon={Package} color="amber" />
        <StatCard title="النشاط اللحظي" value="158" change="عملية/ساعة" trend="up" icon={Activity} color="purple" />
      </div>

      {/* BI Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
          <h2 className="text-sm font-black text-white mb-6">تحليل المبيعات والأرباح (آخر 6 أشهر)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              <Area type="monotone" dataKey="sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="profit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
          <h2 className="text-sm font-black text-white mb-6">توزيع المخزون حسب الفئات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={[{name: 'إلكترونيات', value: 400}, {name: 'أدوات منزلية', value: 300}, {name: 'أغذية', value: 300}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                {salesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
