const API_URL = 'http://localhost:8080';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    shop_name?: string;
    whatsapp_number?: string;
    shop_id?: string;
  }) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  },
};

export const shopApi = {
  getShop: async () => {
    const res = await fetch(`${API_URL}/api/shops`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch shop');
    return res.json();
  },

  updateWhatsApp: async (whatsappNumber: string) => {
    const res = await fetch(`${API_URL}/api/shops/whatsapp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ whatsapp_number: whatsappNumber }),
    });
    if (!res.ok) throw new Error('Failed to update WhatsApp');
    return res.json();
  },
};

export const uploadApi = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to upload image');
    }
    return res.json();
  },
};

export const productApi = {
  getProducts: async (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await fetch(`${API_URL}/api/products?${params}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  getProduct: async (id: string) => {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  createProduct: async (data: {
    name: string;
    description: string;
    category: string;
    purchase_price?: number;
    selling_price: number;
    stock: number;
    image_url?: string;
  }) => {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  },

  updateProduct: async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      purchase_price: number;
      selling_price: number;
      stock: number;
      image_url: string;
    }>
  ) => {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  deleteProduct: async (id: string) => {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },
};

export const transactionApi = {
  getTransactions: async (type?: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    const res = await fetch(`${API_URL}/api/transactions?${params}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  createTransaction: async (data: {
    type: string;
    product_id?: string;
    quantity?: number;
    amount: number;
    comment?: string;
  }) => {
    const res = await fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create transaction');
    }
    return res.json();
  },
};

export const userApi = {
  getUsers: async () => {
    const res = await fetch(`${API_URL}/api/users`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const res = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return res.json();
  },

  deleteUser: async (id: string) => {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },
};

export const reportApi = {
  getDashboard: async () => {
    const res = await fetch(`${API_URL}/api/reports/dashboard`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  },
};

export const publicApi = {
  getPublicProducts: async (shopId: string, category?: string, inStockOnly?: boolean) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (inStockOnly) params.append('in_stock_only', 'true');
    const res = await fetch(`${API_URL}/public/${shopId}/products?${params}`);
    if (!res.ok) throw new Error('Failed to fetch public products');
    return res.json();
  },

  getWhatsAppLink: async (shopId: string, productId: string) => {
    const res = await fetch(`${API_URL}/public/${shopId}/products/${productId}/whatsapp`);
    if (!res.ok) throw new Error('Failed to fetch WhatsApp link');
    return res.json();
  },
};