import { useEffect, useState } from 'react';
import { transactionApi, productApi } from '../services/api';
import Layout from '../components/Layout';
import {
  Receipt,
  Plus,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  product_id?: string;
  product?: { name: string };
  quantity: number;
  amount: number;
  comment?: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  stock: number;
}

interface DailySales {
  date: string;
  totalAmount: number;
  totalItems: number;
  count: number;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showSalesByDate, setShowSalesByDate] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Sale',
    product_id: '',
    quantity: '',
    amount: '',
    comment: '',
  });

  useEffect(() => {
    loadTransactions();
    loadProducts();
  }, [filterType, dateFrom, dateTo]);

  const loadTransactions = async () => {
    try {
      const result = await transactionApi.getTransactions(
        filterType || undefined,
        dateFrom || undefined,
        dateTo || undefined
      );
      setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productApi.getProducts();
      setProducts(result.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleOpenModal = () => {
    setFormData({ type: 'Sale', product_id: '', quantity: '', amount: '', comment: '' });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product && formData.quantity) {
      const totalAmount = product.selling_price * parseInt(formData.quantity);
      setFormData({ ...formData, product_id: productId, amount: totalAmount.toString() });
    } else {
      setFormData({ ...formData, product_id: productId });
    }
  };

  const handleQuantityChange = (quantity: string) => {
    const product = products.find((p) => p.id === formData.product_id);
    if (product && quantity) {
      const totalAmount = product.selling_price * parseInt(quantity);
      setFormData({ ...formData, quantity, amount: totalAmount.toString() });
    } else {
      setFormData({ ...formData, quantity });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data: Parameters<typeof transactionApi.createTransaction>[0] = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        comment: formData.comment || undefined,
      };

      if (formData.type === 'Sale') {
        if (!formData.product_id || !formData.quantity) {
          setError('Product and quantity are required for sales');
          return;
        }
        data.product_id = formData.product_id;
        data.quantity = parseInt(formData.quantity);
      }

      await transactionApi.createTransaction(data);
      handleCloseModal();
      loadTransactions();
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    }
  };

  // Group sales by date for the detail view
  const salesByDate = transactions
    .filter((t) => t.type === 'Sale')
    .reduce<Record<string, DailySales>>((acc, t) => {
      const date = new Date(t.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!acc[date]) {
        acc[date] = { date, totalAmount: 0, totalItems: 0, count: 0 };
      }
      acc[date].totalAmount += t.amount;
      acc[date].totalItems += t.quantity || 0;
      acc[date].count += 1;
      return acc;
    }, {});

  const salesByDateList = Object.values(salesByDate).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalSalesAmount = transactions
    .filter((t) => t.type === 'Sale')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalItemsSold = transactions
    .filter((t) => t.type === 'Sale')
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('fr-FR');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Sale': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'Expense': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'Withdrawal': return <DollarSign className="w-5 h-5 text-orange-600" />;
      default: return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sale': return 'bg-green-100 text-green-800';
      case 'Expense': return 'bg-red-100 text-red-800';
      case 'Withdrawal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">Track all sales, expenses, and withdrawals</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Transaction
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Sales (filtered)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              ${totalSalesAmount.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Items Sold</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totalItemsSold} units</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {['', 'Sale', 'Expense', 'Withdrawal'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                  filterType === type
                    ? type === ''
                      ? 'bg-blue-600 text-white'
                      : type === 'Sale'
                      ? 'bg-green-600 text-white'
                      : type === 'Expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type || 'All'}
              </button>
            ))}
          </div>

          {/* Date filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-sm text-red-600 hover:underline"
              >
                Clear dates
              </button>
            )}

            <button
              onClick={() => setShowSalesByDate(!showSalesByDate)}
              className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                showSalesByDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Sales by date
            </button>
          </div>
        </div>

        {/* Sales by Date detail view */}
        {showSalesByDate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sales Detail by Date</h2>
            </div>
            {salesByDateList.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">No sales found for the selected period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Transactions</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Items Sold</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByDateList.map((day) => (
                      <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{day.date}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{day.count}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{day.totalItems}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-green-600">
                          ${day.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="py-3 px-4 text-sm font-bold text-gray-900">Total</td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-900">
                        {salesByDateList.reduce((s, d) => s + d.count, 0)}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-900">{totalItemsSold}</td>
                      <td className="py-3 px-4 text-sm font-bold text-green-700">
                        ${totalSalesAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transactions table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Qty</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Comment</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {transaction.product?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {transaction.quantity || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 max-w-xs">
                      {transaction.comment ? (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{transaction.comment}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(transaction.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="p-12 text-center">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-6">Start by recording your first transaction</p>
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                New Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">New Transaction</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, amount: '', product_id: '', quantity: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Sale">Sale</option>
                  <option value="Expense">Expense</option>
                  <option value="Withdrawal">Withdrawal</option>
                </select>
              </div>

              {formData.type === 'Sale' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                  {formData.type === 'Sale' && formData.amount && (
                    <span className="text-xs text-gray-400 ml-2">(auto-calculé, modifiable)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              {/* Comment field - especially useful for Expense/Withdrawal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    Comment
                    {formData.type !== 'Sale' && (
                      <span className="text-gray-400 text-xs">(recommended for {formData.type.toLowerCase()}s)</span>
                    )}
                  </span>
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder={
                    formData.type === 'Expense'
                      ? 'e.g. Electricity bill, rent, supplier invoice...'
                      : formData.type === 'Withdrawal'
                      ? 'e.g. Owner withdrawal, petty cash...'
                      : 'Optional note...'
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}