import { useEffect, useState, useMemo } from 'react';
import { reportApi, transactionApi } from '../services/api';
import Layout from '../components/Layout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Receipt,
  AlertTriangle,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  total_sales: number;
  total_expenses: number;
  net_profit: number;
  low_stock_products: Array<{ id: string; name: string; stock: number; category: string }>;
  total_products: number;
  total_transactions: number;
  total_items_sold: number;
}

interface Transaction {
  id: string;
  type: string;
  product?: { name: string };
  quantity: number;
  amount: number;
  created_at: string;
}

type Period = '7j' | '30j' | '90j' | 'custom';

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 jours', value: '7j' },
  { label: '30 jours', value: '30j' },
  { label: '90 jours', value: '90j' },
  { label: 'Personnalisé', value: 'custom' },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30j');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [period, customFrom, customTo]);

  const loadDashboard = async () => {
    try {
      const result = await reportApi.getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    if (period === 'custom') return { from: customFrom, to: customTo };
    const to = new Date();
    const from = new Date();
    if (period === '7j') from.setDate(from.getDate() - 7);
    else if (period === '30j') from.setDate(from.getDate() - 30);
    else if (period === '90j') from.setDate(from.getDate() - 90);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  };

  const loadTransactions = async () => {
    const { from, to } = getDateRange();
    if (period === 'custom' && (!from || !to)) return;
    try {
      const result = await transactionApi.getTransactions(undefined, from, to);
      setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions for charts:', error);
    }
  };

  // Chart 1 : Ventes par jour
  const salesByDay = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'Sale')
      .forEach((t) => {
        const day = new Date(t.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
        });
        map[day] = (map[day] || 0) + t.amount;
      });

    const { from, to } = getDateRange();
    if (!from || !to) return Object.entries(map).map(([date, ventes]) => ({ date, ventes }));

    const result = [];
    const cur = new Date(from);
    const end = new Date(to);
    while (cur <= end) {
      const key = cur.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      result.push({ date: key, ventes: map[key] || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [transactions, period, customFrom, customTo]);

  // Chart 2 : Ventes vs Dépenses par semaine
  const salesVsExpenses = useMemo(() => {
    const map: Record<string, { ventes: number; dépenses: number }> = {};
    transactions.forEach((t) => {
      const d = new Date(t.created_at);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date(t.created_at).setDate(diff));
      const key = monday.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { ventes: 0, dépenses: 0 };
      if (t.type === 'Sale') map[key].ventes += t.amount;
      if (t.type === 'Expense' || t.type === 'Withdrawal') map[key].dépenses += t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semaine, v]) => ({ semaine, ...v }));
  }, [transactions]);

  // Chart 3 : Top produits
  const topProducts = useMemo(() => {
    const map: Record<string, { quantite: number; montant: number }> = {};
    transactions
      .filter((t) => t.type === 'Sale' && t.product?.name)
      .forEach((t) => {
        const name = t.product!.name;
        if (!map[name]) map[name] = { quantite: 0, montant: 0 };
        map[name].quantite += t.quantity || 0;
        map[name].montant += t.amount;
      });
    return Object.entries(map)
      .map(([produit, v]) => ({ produit, ...v }))
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 8);
  }, [transactions]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount);

  const stats = [
    {
      name: 'Total Sales',
      value: formatCurrency(data?.total_sales || 0),
      icon: TrendingUp,
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Total Expenses',
      value: formatCurrency(data?.total_expenses || 0),
      icon: TrendingDown,
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Net Profit',
      value: formatCurrency(data?.net_profit || 0),
      icon: DollarSign,
      textColor: (data?.net_profit ?? 0) >= 0 ? 'text-blue-700' : 'text-red-700',
      bgColor: (data?.net_profit ?? 0) >= 0 ? 'bg-blue-50' : 'bg-red-50',
    },
    {
      name: 'Items Sold',
      value: `${data?.total_items_sold || 0} units`,
      icon: ShoppingCart,
      textColor: 'text-teal-700',
      bgColor: 'bg-teal-50',
    },
    {
      name: 'Total Products',
      value: data?.total_products || 0,
      icon: Package,
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Total Transactions',
      value: data?.total_transactions || 0,
      icon: Receipt,
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your shop performance</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.name}</p>
                    <p className={`text-2xl font-bold mt-2 ${stat.textColor}`}>{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Period selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 text-blue-500" />
              Période des graphiques :
            </div>
            <div className="flex gap-2 flex-wrap">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    period === p.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Chart 1 : Ventes par jour */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-50 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ventes par jour</h2>
              <p className="text-sm text-gray-500">Montant total des ventes quotidiennes</p>
            </div>
          </div>
          {salesByDay.every((d) => d.ventes === 0) ? (
            <p className="text-center text-gray-400 py-12 text-sm">Aucune vente sur cette période</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesByDay} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  interval={salesByDay.length > 20 ? Math.floor(salesByDay.length / 10) : 0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Ventes']}
                />
                <Line
                  type="monotone"
                  dataKey="ventes"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={salesByDay.length <= 14}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2 : Ventes vs Dépenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ventes vs Dépenses</h2>
              <p className="text-sm text-gray-500">Comparaison par semaine</p>
            </div>
          </div>
          {salesVsExpenses.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Aucune donnée sur cette période</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesVsExpenses} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semaine" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  formatter={(v: number | undefined, name: string | undefined) => [
                    `$${(v ?? 0).toFixed(2)}`,
                    name,
                  ]}
                />
                <Legend />
                <Bar dataKey="ventes" name="Ventes" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dépenses" name="Dépenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 3 : Top produits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Top produits vendus</h2>
              <p className="text-sm text-gray-500">Par chiffre d'affaires sur la période</p>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Aucune vente sur cette période</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 45)}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="produit"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  width={130}
                />
                <Tooltip
                  formatter={(v: number | undefined, name: string | undefined) => [
                    name === 'montant' ? `$${(v ?? 0).toFixed(2)}` : `${v ?? 0} unités`,
                    name === 'montant' ? 'Montant' : 'Quantité',
                  ]}
                />
                <Legend formatter={(v) => (v === 'montant' ? 'Montant ($)' : 'Quantité')} />
                <Bar dataKey="montant" name="montant" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                <Bar dataKey="quantite" name="quantite" fill="#a78bfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Alert */}
        {data && data.low_stock_products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-50 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Low Stock Alert</h2>
                <p className="text-sm text-gray-600">Products that need restocking soon</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Product Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data.low_stock_products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{product.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{product.category || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}