import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addSale, getSale, updateSale, getProduct, updateProduct } from '../../lib/api';
import { generateSaleNumber } from '../../lib/receiptNumber';
import { useToast } from '../../context/ToastContext';
import CustomerPicker from '../../components/CustomerPicker';
import ProductPicker from '../../components/ProductPicker';

export default function SaleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const isEdit = Boolean(id);

  const [customerId, setCustomerId] = useState(null);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [errors, setErrors] = useState({});
  const [oldItems, setOldItems] = useState([]); // snapshot for stock reversal on edit

  useEffect(() => {
    if (id) {
      getSale(id).then((s) => {
        if (!s) return navigate('/sales');
        setCustomerId(s.customerId || null);
        setItems(s.items || []);
        setOldItems(s.items || []);
        setDiscount(String(s.discount || ''));
        setPaymentMethod(s.paymentMethod || 'Cash');
      });
    }
  }, [id, navigate]);

  function addItem(product) {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setErrors((prev) => ({
        ...prev,
        [`qty_${product.id}`]: undefined,
      }));
      setItems((prev) =>
        prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        unitCost: product.costPrice || 0,
      },
    ]);
    setErrors((prev) => ({
      ...prev,
      [`qty_${product.id}`]: undefined,
    }));
  }

  function updateItem(productId, field, value) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, [field]: value } : i
      )
    );
    setErrors((prev) => ({
      ...prev,
      [`qty_${productId}`]: undefined,
    }));
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function validate() {
    const e = {};
    if (items.length === 0) {
      e.items = 'Add at least one item';
    }
    for (const item of items) {
      if (!item.quantity || item.quantity < 1) {
        e[`qty_${item.productId}`] = 'Quantity must be at least 1';
        continue;
      }
      const product = await getProduct(item.productId);
      if (product && item.quantity > product.stock) {
        e[
          `qty_${item.productId}`
        ] = `Only ${product.stock} in stock`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!(await validate())) return;

    const totalAmount = items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0
    );

    if (isEdit) {
      // Restore stock for old items
      for (const item of oldItems) {
        const product = await getProduct(item.productId);
        if (product) {
          await updateProduct(item.productId, {
            stock: (product.stock || 0) + item.quantity,
          });
        }
      }

      await updateSale(id, {
        customerId: customerId ? Number(customerId) : null,
        items,
        totalAmount,
        discount: Number(discount) || 0,
        paymentMethod,
      });

      // Decrement stock for new items
      for (const item of items) {
        const product = await getProduct(item.productId);
        if (product) {
          await updateProduct(item.productId, {
            stock: product.stock - item.quantity,
          });
        }
      }

      addToast('Sale updated');
    } else {
      const receiptNumber = await generateSaleNumber();

      // Decrement stock
      for (const item of items) {
        const product = await getProduct(item.productId);
        if (product) {
          await updateProduct(item.productId, {
            stock: product.stock - item.quantity,
          });
        }
      }

      await addSale({
        customerId: customerId ? Number(customerId) : null,
        saleType: 'Accessory',
        items,
        totalAmount,
        discount: Number(discount) || 0,
        paymentMethod,
        createdAt: new Date().toISOString(),
        receiptNumber,
      });

      addToast('Sale completed');
    }
    navigate('/sales');
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = subtotal - (Number(discount) || 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Sale' : 'New Sale'}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer (optional)
            </label>
            <CustomerPicker
              value={customerId}
              onChange={setCustomerId}
            />
          </div>

          {/* Product Picker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Add Items
            </h3>
            <ProductPicker onSelect={addItem} />
            {errors.items && (
              <p className="mt-2 text-xs text-red-600">{errors.items}</p>
            )}
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Items ({items.length})
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.productName}
                      </p>
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            'quantity',
                            Number(e.target.value)
                          )
                        }
                        min="1"
                        className={`w-full border rounded px-2 py-1 text-sm text-center ${
                          errors[`qty_${item.productId}`]
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      />
                      {errors[`qty_${item.productId}`] && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {errors[`qty_${item.productId}`]}
                        </p>
                      )}
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Discount</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                min="0"
              />
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">{total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="BankTransfer">Bank Transfer</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            {isEdit ? 'Update Sale' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
