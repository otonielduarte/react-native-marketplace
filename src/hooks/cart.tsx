import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

const STORAGE_KEY = '@gomarketplace-products';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  const updateValues = useCallback(
    async values => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        setProducts(values);
      } catch (e) {
        console.error('error during save values');
      }
    },
    [setProducts],
  );

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const storageProducts = await AsyncStorage.getItem(STORAGE_KEY);
        if (storageProducts !== null) {
          setProducts(JSON.parse(storageProducts));
        }
      } catch (e) {
        console.error('error during save values');
      }
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const updatedValues = products.map(prod => {
        if (prod.id === id) {
          const newProduct = prod;
          newProduct.quantity += 1;
          return newProduct;
        }
        return prod;
      });

      await updateValues(updatedValues);
    },
    [products, updateValues],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(prod => prod.id === id);
      if (!product) return;
      const qtd = product.quantity - 1;
      let updatedValues = [];
      if (qtd > 0) {
        updatedValues = products.map(p => {
          if (p.id === product.id) {
            const newProduct = p;
            newProduct.quantity = qtd;
            return newProduct;
          }
          return p;
        });
      } else {
        updatedValues = products.filter(p => p.id !== product.id);
      }
      await updateValues(updatedValues);
    },
    [products, updateValues],
  );

  const addToCart = useCallback(
    async product => {
      if (products.some(p => p.id === product.id)) {
        await increment(product.id);
      } else {
        await updateValues([...products, { ...product, quantity: 1 }]);
      }
    },
    [updateValues, products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
