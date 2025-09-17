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

      await addDoc(collection(db, 'customers'), newCustomer);
      alert('Customer berhasil ditambahkan!');
      
      setInvoice({
        ...invoice,
        customerId: newCustomer.customerId,
        customerName: newCustomer.customerName,
        customerContact: newCustomer.customerContact
      });
      
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
    const html = `
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
          </style>
        </head>
        <body>
          <div class="header">
            <h2>NOTA PENJUALAN</h2>
            <p>Kepada Yth: ${invoice.customerName}</p>
            <p>ID: ${invoice.customerId} | Kontak: ${invoice.customerContact}</p>
            <p>Tanggal: ${invoice.date} | Jatuh Tempo: ${invoice.dueDate}</p>
            <p>No: ${invoice.invoiceNumber}</p>
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
            <p>${invoice.notes}</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredCustomers = customers.filter(customer => 
    customer.customerId?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.customerName?.toLowerCase().includes(customerSearch.toLowerCase())
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

      {activeTab === 'create' && (
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
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.no}</td>
                  <td>
                    <input 
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      placeholder="Nama barang"
                    />
                  </td>
                  <td>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
