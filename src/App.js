import { useState, useEffect } from 'react';
import './App.css'; // Pastikan file ini ada untuk styling

// Konfigurasi Firebase (ganti dengan konfigurasi Anda)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEffJGt_SY9vwVnq5k3jfI5Y1N45sowi0",
  authDomain: "invoice-lababil.firebaseapp.com",
  projectId: "invoice-lababil",
  storageBucket: "invoice-lababil.firebasestorage.app",
  messagingSenderId: "839583838842",
  appId: "1:839583838842:web:cd0613f72987042383c1c3"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  // State untuk mengelola tab aktif, data invoice, daftar invoice, dan modal pelanggan
  const [activeTab, setActiveTab] = useState('create');
  const [invoice, setInvoice] = useState({
    customerId: '',
    customerName: '',
    customerContact: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceNumber: '',
    items: [{ no: 1, itemName: '', quantity: 0, unit: '', price: 0, total: 0 }],
    subtotal: 0,
    discount: 0,
    downPayment: 0,
    grandTotal: 0
  });
  const [invoices, setInvoices] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ customerId: '', customerName: '', customerContact: '' });

  // Ambil daftar invoice dari Firebase saat komponen dimuat
  useEffect(() => {
    const fetchInvoices = async () => {
      const querySnapshot = await getDocs(collection(db, 'invoices'));
      setInvoices(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchInvoices();
    // Generate nomor invoice otomatis
    if (!invoice.invoiceNumber) {
      setInvoice(prev => ({ ...prev, invoiceNumber: `INV-${Date.now()}` }));
    }
  }, []);

  // Hitung ulang subtotal dan grand total saat items/diskon/DP berubah
  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const grandTotal = subtotal - invoice.discount - invoice.downPayment;
    setInvoice(prev => ({ ...prev, subtotal, grandTotal }));
  }, [invoice.items, invoice.discount, invoice.downPayment]);

  // Fungsi untuk memperbarui item dalam daftar barang
  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Tambah barang baru ke daftar
  const addItem = () => {
    const newItems = [...invoice.items, { no: invoice.items.length + 1, itemName: '', quantity: 0, unit: '', price: 0, total: 0 }];
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Hapus barang dari daftar
  const removeItem = (index) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    newItems.forEach((item, i) => { item.no = i + 1; });
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Simpan invoice ke Firebase
  const saveInvoice = async () => {
    if (!invoice.customerName || invoice.items.some(item => !item.itemName || item.quantity <= 0)) {
      alert('Lengkapi data invoice!');
      return;
    }
    await addDoc(collection(db, 'invoices'), invoice);
    setInvoice({
      customerId: '',
      customerName: '',
      customerContact: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceNumber: '',
      items: [{ no: 1, itemName: '', quantity: 0, unit: '', price: 0, total: 0 }],
      subtotal: 0,
      discount: 0,
      downPayment: 0,
      grandTotal: 0
    });
    fetchInvoices();
    alert('Invoice disimpan!');
  };

  // Simpan data pelanggan dari modal
  const handleCustomerSubmit = () => {
    setInvoice(prev => ({ ...prev, customerId: newCustomer.customerId, customerName: newCustomer.customerName, customerContact: newCustomer.customerContact }));
    setNewCustomer({ customerId: '', customerName: '', customerContact: '' });
    setShowCustomerModal(false);
  };

  return (
    <div className="App">
      <h1>Sistem Invoice Online</h1>

      {/* Tab Navigasi */}
      <div className="tabs">
        <button onClick={() => setActiveTab('create')} className={activeTab === 'create' ? 'active' : ''}>Buat Invoice Baru</button>
        <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'active' : ''}>Daftar Invoice</button>
      </div>

      {/* Tab Buat Invoice */}
      {activeTab === 'create' && (
        <div className="create-invoice">
          <h2>Buat Invoice Baru</h2>

          <section>
            <h3>Data Customer</h3>
            {invoice.customerName && (
              <div>
                <h4>Customer:</h4>
                <p>ID: {invoice.customerId}</p>
                <p>Nama: {invoice.customerName}</p>
                <p>Kontak: {invoice.customerContact}</p>
              </div>
            )}
            <button onClick={() => setShowCustomerModal(true)}>Tambah Customer</button>
          </section>

          <section>
            <label>Tanggal: <input type="date" value={invoice.date} onChange={(e) => setInvoice({...invoice, date: e.target.value})} /></label>
            <label>Tempo: <input type="date" value={invoice.dueDate} onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})} /></label>
            <label>No. Invoice: <input type="text" value={invoice.invoiceNumber} onChange={(e) => setInvoice({...invoice, invoiceNumber: e.target.value})} placeholder="Auto generate" /></label>
          </section>

          <section>
            <h3>Daftar Barang</h3>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Barang</th>
                  <th>Qty</th>
                  <th>Satuan</th>
                  <th>Harga</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.no}</td>
                    <td><input type="text" value={item.itemName} onChange={(e) => updateItem(index, 'itemName', e.target.value)} /></td>
                    <td><input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} /></td>
                    <td><input type="text" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} /></td>
                    <td><input type="number" value={item.price} onChange={(e) => updateItem(index, 'price', parseInt(e.target.value) || 0)} /></td>
                    <td>Rp {item.total.toLocaleString('id-ID')}</td>
                    <td><button onClick={() => removeItem(index)}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addItem}>Tambah Barang</button>
          </section>

          <section className="totals">
            <p>Subtotal: Rp {invoice.subtotal.toLocaleString('id-ID')}</p>
            <label>Diskon: <input type="number" value={invoice.discount} onChange={(e) => {
              const discount = parseInt(e.target.value) || 0;
              const grandTotal = invoice.subtotal - discount - invoice.downPayment;
              setInvoice({...invoice, discount, grandTotal});
            }} /></label>
            <label>DP: <input type="number" value={invoice.downPayment} onChange={(e) => {
              const downPayment = parseInt(e.target.value) || 0;
              const grandTotal = invoice.subtotal - invoice.discount - downPayment;
              setInvoice({...invoice, downPayment, grandTotal});
            }} /></label>
            <h3>TOTAL: Rp {invoice.grandTotal.toLocaleString('id-ID')}</h3>
            <button onClick={saveInvoice}>Simpan Invoice</button>
          </section>
        </div>
      )}

      {/* Tab Daftar Invoice */}
      {activeTab === 'list' && (
        <div className="list-invoices">
          <h2>Daftar Invoice</h2>
          {invoices.length === 0 ? (
            <div>
              <h3>Belum ada invoice</h3>
              <p>Buat invoice pertama Anda</p>
            </div>
          ) : (
            invoices.map(inv => (
              <div key={inv.id} className="invoice-card">
                <h3>Invoice #{inv.invoiceNumber}</h3>
                <p>Customer: {inv.customerName}</p>
                <p>Tanggal: {inv.date}</p>
                <p>Total: Rp {inv.grandTotal?.toLocaleString('id-ID')}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Input Customer */}
      {showCustomerModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Input Data Customer</h2>
            <label>ID: <input type="text" value={newCustomer.customerId} onChange={(e) => setNewCustomer({...newCustomer, customerId: e.target.value})} /></label>
            <label>Nama: <input type="text" value={newCustomer.customerName} onChange={(e) => setNewCustomer({...newCustomer, customerName: e.target.value})} /></label>
            <label>Kontak: <input type="text" value={newCustomer.customerContact} onChange={(e) => setNewCustomer({...newCustomer, customerContact: e.target.value})} /></label>
            <button onClick={handleCustomerSubmit}>Simpan</button>
            <button onClick={() => setShowCustomerModal(false)}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
