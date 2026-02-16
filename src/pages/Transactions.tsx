import { useEffect, useState } from 'react';
import { transactionApi, productApi } from '../services/api';
import Layout from '../components/Layout';
import { Receipt, Plus, X, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  product_id?: string;
  product?: {
    name: string;
  };
  quantity: number;
  amount: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  stock: number;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    type: 'Sale',
    product_id: '',
    quantity: '',
    amount: '',
  });

  useEffect(() => {
    loadTransactions();
    loadProducts();
  }, [filterType]);

  const loadTransactions = async () => {
    try {
      const result = await transactionApi.getTransactions(filterType || undefined);
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
    setFormData({
      type: 'Sale',
      product_id: '',
      quantity: '',
      amount: '',
    });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleProductChange = (productId: string) => {
    setFormData({ ...formData, product_id: productId });

    if (formData.type === 'Sale' && productId) {
      const product = products.find((p) => p.id === productId);
      if (product && formData.quantity) {
        const totalAmount = product.selling_price * parseInt(formData.quantity);
        setFormData({ ...formData, product_id: productId, amount: totalAmount.toString() });
      }
    }
  };

  const handleQuantityChange = (quantity: string) => {
    setFormData({ ...formData, quantity });

    if (formData.type === 'Sale' && formData.product_id && quantity) {
      const product = products.find((p) => p.id === formData.product_id);
      if (product) {
        const totalAmount = product.selling_price * parseInt(quantity);
        setFormData({ ...formData, quantity, amount: totalAmount.toString() });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data: {
        type: string;
        product_id?: string;
        quantity?: number;
        amount: number;
      } = {
        type: formData.type,
        amount: parseFloat(formData.amount),
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Sale':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'Expense':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'Withdrawal':
        return <DollarSign className="w-5 h-5 text-orange-600" />;
      default:
        return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sale':
        return 'bg-green-100 text-green-800';
      case 'Expense':
        return 'bg-red-100 text-red-800';
      case 'Withdrawal':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('Sale')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'Sale'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setFilterType('Expense')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'Expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setFilterType('Withdrawal')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'Withdrawal'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Withdrawals
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                            transaction.type
                          )}`}
                        >
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
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="p-12 text-center">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No transactions found
              </h3>
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
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
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
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  readOnly={formData.type === 'Sale'}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
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
