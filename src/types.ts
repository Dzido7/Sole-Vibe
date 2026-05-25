export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  features: string[];
  sizes: number[];
  sizesStock: { [size: number]: number };
  colors: string[];
  images: string[];
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  username: string;
  title: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface CartItem {
  productId: string;
  selectedSize: number;
  selectedColor: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  trackingId: string;
  status: 'processing' | 'shipped' | 'in-transit' | 'delivered';
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize: number;
    selectedColor: string;
    image: string;
  }[];
  customerInfo: {
    name: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
  };
  paymentMethod: string;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  date: string;
  history: {
    status: 'processing' | 'shipped' | 'in-transit' | 'delivered';
    timestamp: string;
    description: string;
  }[];
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'sale' | 'new-arrival' | 'low-stock';
  productId?: string;
}
