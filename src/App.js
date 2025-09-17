import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [newCustomer, setNewCustomer] = useState({
    customerId: '',
    customerName: '',
    customerContact: ''
  });

  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    warehouse: 'GD JBI',
    customerId: '',
    customerName: '',
    customerContact: '',
    items: [{
      no: 1,
      itemName: '',
      quantity: 1,
      unit: 'pcs',
      price: 0,
      total: 0
    }],
    subtotal: 0,
    discount: 0,
    downPayment: 0,
    grandTotal: 0,
    notes: 'BARANG YANG SUDAH DI BELI TIDAK DAPAT DI TUKAR ATAU DIKEMBALIKAN'
  });

  // Lanjutkan dengan kode lengkap dari sebelumnya...
}

export default App;
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // State untuk customer baru
  const [newCustomer, setNewCustomer] = useState({
    customerId: '',
    customerName: '',
    customerContact: ''
  });

  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    warehouse: 'GD JBI',
    customerId: '',
    customerName: '',
    customerContact: '',
    items: [{
      no: 1,
      itemName: '',
      quantity: 1,
      unit: 'pcs',
      price: 0,
      total: 0
    }],
    subtotal: 0,
    discount: 0,
    downPayment: 0,
    grandTotal: 0,
    notes: 'BARANG YANG SUDAH DI BELI TIDAK DAPAT DI TUKAR ATAU DIKEMBALIKAN'
  });

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customersList = [];
      querySnapshot.forEach((doc) => {
        customersList.push({ id: doc.id, ...doc.data() });
      });
      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'invoices'));
      const invoicesList = [];
      querySnapshot.forEach((doc) => {
        invoicesList.push({ id: doc.id, ...doc.data() });
      });
      setInvoices(invoicesList);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const saveCustomer = async () => {
    try {
      if (!newCustomer.customerId || !newCustomer.customerName) {
        alert('ID dan Nama customer harus diisi!');
        return;
      }

      // Check if customer ID already exists
      const q = query(collection(db, 'customers'), where('customerId', '==', newCustomer.customerId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('ID Customer sudah ada!');
        return;
      }

      await addDoc(collection(db, 'customers'), newCustomer);
      alert('Customer berhasil ditambahkan!');
      
      // Set customer to invoice
      setInvoice({
        ...invoice,
        customerId: newCustomer.customerId,
        customerName: newCustomer.customerName,
        customerContact: newCustomer.customerContact
      });
      
      // Reset form
      setNewCustomer({
        customerId: '',
        customerName: '',
        customerContact: ''
      });
      
      setShowCustomerModal(false);
      loadCustomers();
    } catch (error) {
      console.error('Error:', error);
      alert('Error menyimpan customer!');
    }
  };

  const selectCustomer = (customer) => {
    setInvoice({
      ...invoice,
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerContact: customer.customerContact
    });
    setSelectedCustomer(customer);
    setCustomerSearch('');
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, {
        no: invoice.items.length + 1,
        itemName: '',
        quantity: 1,
        unit: 'pcs',
        price: 0,
        total: 0
      }]
    });
  };

  const removeItem = (index) => {
    if (invoice.items.length === 1) {
      alert('Minimal harus ada 1 item!');
      return;
    }
    const newItems = invoice.items.filter((_, i) => i !== index);
    newItems.forEach((item, i) => item.no = i + 1);
    updateTotals(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    
    updateTotals(newItems);
  };

  const updateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = subtotal - invoice.discount - invoice.downPayment;
    
    setInvoice({
      ...invoice,
      items: items,
      subtotal,
      grandTotal
    });
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    const dateStr = date.toISOString().slice(2,10).replace(/-/g, '');
    return `${random}/SS/JBI/${dateStr}`;
  };

  const saveInvoice = async () => {
    try {
      if (!invoice.customerName) {
        alert('Pilih atau masukkan customer!');
        return;
      }

      const invoiceToSave = {
        ...invoice,
        invoiceNumber: invoice.invoiceNumber || generateInvoiceNumber(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'invoices'), invoiceToSave);
      alert('Invoice berhasil disimpan!');
      
      // Reset form
      setInvoice({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        warehouse: 'GD JBI',
        customerId: '',
        customerName: '',
        customerContact: '',
        items: [{
          no: 1,
          itemName: '',
          quantity: 1,
          unit: 'pcs',
          price: 0,
          total: 0
        }],
        subtotal: 0,
        discount: 0,
        downPayment: 0,
        grandTotal: 0,
        notes: 'BARANG YANG SUDAH DI BELI TIDAK DAPAT DI TUKAR ATAU DIKEMBALIKAN'
      });
      
      setSelectedCustomer(null);
      loadInvoices();
      setActiveTab('list');
    } catch (error) {
      console.error('Error:', error);
      alert('Error menyimpan invoice!');
    }
  };

  const deleteInvoice = async (id) => {
    if (window.confirm('Hapus invoice ini?')) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
        loadInvoices();
        alert('Invoice berhasil dihapus!');
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
            .header { margin-bottom: 20px; }
            .footer { margin-top: 20px; }
            .customer-info { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>NOTA PENJUALAN</h2>
            <div class="customer-info">
              <p><strong>Kepada Yth:</strong></p>
              <p>ID: ${invoice.customerId}</p>
              <p>Nama: ${invoice.customerName}</p>
              <p>Kontak: ${invoice.customerContact}</p>
            </div>
            <p>Tanggal: ${invoice.date} | Jatuh Tempo: ${invoice.dueDate}</p>
            <p>No. Invoice: ${invoice.invoiceNumber}</p>
            <p>Gudang: ${invoice.warehouse}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang</th>
                <th>Qty</th>
                <th>Satuan</th>
                <th>Harga</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.no}</td>
                  <td>${item.itemName}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>Rp ${item.price.toLocaleString('id-ID')}</td>
                  <td>Rp ${item.total.toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Subtotal: Rp ${invoice.subtotal.toLocaleString('id-ID')}</p>
            <p>Diskon: Rp ${invoice.discount.toLocaleString('id-ID')}</p>
            <p>DP: Rp ${invoice.downPayment.toLocaleString('id-ID')}</p>
            <p><strong>TOTAL: Rp ${invoice.grandTotal.toLocaleString('id-ID')}</strong></p>
            <p style="margin-top: 20px;">${invoice.notes}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredCustomers = customers.filter(customer => 
    customer.customerId.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.customerName.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>📋 Sistem Invoice Online</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'create' ? 'active' : ''} 
            onClick={() => setActiveTab('create')}
          >
            Buat Invoice
          </button>
          <button 
            className={activeTab === 'list' ? 'active' : ''} 
            onClick={() => setActiveTab('list')}
          >
            Daftar Invoice
          </button>
          <button 
            className={activeTab === 'customers' ? 'active' : ''} 
            onClick={() => setActiveTab('customers')}
          >
            Data Customer
          </button>
        </div>
      </header>

      {activeTab === 'create' ? (
        <div className="invoice-form">
          <h2>Buat Invoice Baru</h2>
          
          <div className="customer-section">
            <h3>Data Customer</h3>
            <div className="customer-controls">
              <button onClick={() => setShowCustomerModal(true)} className="btn-primary">
                + Customer Baru
              </button>
              <input 
                type="text"
                placeholder="Cari customer (ID atau Nama)..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            {customerSearch && (
              <div className="customer-dropdown">
                {filteredCustomers.map(customer => (
                  <div 
                    key={customer.id} 
                    className="customer-item"
                    onClick={() => selectCustomer(customer)}
                  >
                    <strong>{customer.customerId}</strong> - {customer.customerName}
                    <span className="contact">{customer.customerContact}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedCustomer && (
              <div className="selected-customer">
                <h4>Customer Terpilih:</h4>
                <p>ID: {invoice.customerId}</p>
                <p>Nama: {invoice.customerName}</p>
                <p>Kontak: {invoice.customerContact}</p>
              </div>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Tanggal:</label>
              <input 
                type="date" 
                value={invoice.date}
                onChange={(e) => setInvoice({...invoice, date: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Jatuh Tempo:</label>
              <input 
                type="date" 
                value={invoice.dueDate}
                onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>No. Invoice:</label>
              <input 
                type="text" 
                value={invoice.invoiceNumber}
                onChange={(e) => setInvoice({...invoice, invoiceNumber: e.target.value})}
                placeholder="Auto generate jika kosong"
              />
            </div>

            <div className="form-group">
              <label>Gudang:</label>
              <select 
                value={invoice.warehouse}
                onChange={(e) => setInvoice({...invoice, warehouse: e.target.value})}
              >
                <option value="GD JBI">GD JBI</option>
                <option value="GD PUSAT">GD PUSAT</option>
                <option value="GD CABANG">GD CABANG</option>
              </select>
            </div>
          </div>

          <h3>Daftar Barang</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th width="5%">No</th>
                <th width="35%">Nama Barang</th>
                <th width="10%">Qty</th>
                <th width="10%">Satuan</th>
                <th width="15%">Harga</th>
                <th width="15%">Jumlah</th>
                <th width="10%">Aksi</th>
              </tr>
            </thead>
            <tbody>
.App {
  min-height: 100vh;
  background: #f5f5f5;
}

.App-header {
  background: #2c3e50;
  color: white;
  padding: 20px;
  text-align: center;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: #34495e;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

.tabs button.active {
  background: #3498db;
}

.invoice-form {
  max-width: 1200px;
  margin: 20px auto;
  padding: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.customer-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.customer-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.customer-dropdown {
  background: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  max-height: 200px;
  overflow-y: auto;
}

.customer-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.customer-item:hover {
  background: #f0f0f0;
}

.selected-customer {
  background: #e8f4f8;
  padding: 15px;
  border-radius: 5px;
  margin-top: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
}

.form-group input, .form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.items-table th {
  background: #34495e;
  color: white;
  padding: 10px;
  text-align: left;
}

.items-table td {
  padding: 8px;
  border: 1px solid #ddd;
}

.items-table input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 500px;
  max-width: 90%;
}

.invoice-list {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.invoice-card {
  background: white;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.invoice-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-print {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.summary {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

.summary-row.total {
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
  border-top: 2px solid #ddd;
  padding-top: 10px;
}
