import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [invoices, setInvoices] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
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
  }, []);

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

  const setCustomerData = () => {
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
    newItems.forEach((item, i) => {
      item.no = i + 1;
    });
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
    return random + '/SS/JBI/' + dateStr;
  };

  const saveInvoice = async () => {
    try {
      if (!invoice.customerName) {
        alert('Masukkan data customer!');
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

  const printInvoice = (inv) => {
    window.print();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistem Invoice Online</h1>
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
        </div>
      </header>

      {activeTab === 'create' && (
        <div className="invoice-form">
          <h2>Buat Invoice Baru</h2>
          
          <div className="customer-section">
            <h3>Data Customer</h3>
            <button onClick={() => setShowCustomerModal(true)} className="btn-primary">
              Input Data Customer
            </button>

            {invoice.customerName && (
              <div className="selected-customer">
                <h4>Customer:</h4>
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
                placeholder="Auto generate"
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
                  <td>
                    <input 
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <input 
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td>Rp {item.total.toLocaleString('id-ID')}</td>
                  <td>
                    <button onClick={() => removeItem(index)} className="btn-remove">
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addItem} className="btn-add">+ Tambah Item</button>

          <div className="summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>Rp {invoice.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="summary-row">
              <span>Diskon:</span>
              <input 
                type="number"
                value={invoice.discount}
                onChange={(e) => {
                  const discount = parseInt(e.target.value) || 0;
                  const grandTotal = invoice.subtotal - discount - invoice.downPayment;
                  setInvoice({...invoice, discount, grandTotal});
                }}
              />
            </div>
            <div className="summary-row">
              <span>DP:</span>
              <input 
                type="number"
                value={invoice.downPayment}
                onChange={(e) => {
                  const downPayment = parseInt(e.target.value) || 0;
                  const grandTotal = invoice.subtotal - invoice.discount - downPayment;
                  setInvoice({...invoice, downPayment, grandTotal});
                }}
              />
            </div>
            <div className="summary-row total">
              <span>TOTAL:</span>
              <span>Rp {invoice.grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button onClick={saveInvoice} className="btn-primary" style={{marginTop: '20px', width: '100%'}}>
            Simpan Invoice
          </button>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="invoice-list">
          <h2>Daftar Invoice</h2>
          {invoices.length === 0 ? (
            <div className="empty-state">
              <h3>Belum ada invoice</h3>
              <p>Buat invoice pertama Anda</p>
            </div>
          ) : (
            invoices.map(inv => (
              <div key={inv.id} className="invoice-card">
                <h3>Invoice #{inv.invoiceNumber}</h3>
                <div className="invoice-info">
                  <p><strong>Customer:</strong> {inv.customerName}</p>
                  <p><strong>Tanggal:</strong> {inv.date}</p>
                  <p><strong>Total:</strong> Rp {inv.grandTotal?.toLocaleString('id-ID')}</p>
                </div>
                <div className="invoice-actions">
                  <button onClick={() => printInvoice(inv)} className="btn-print">
                    Print
                  </button>
                  <button onClick={() => deleteInvoice(inv.id)} className="btn-delete">
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showCustomerModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Input Data Customer</h2>
            <div className="modal-form">
              <input 
                type="text"
                placeholder="ID Customer"
                value={newCustomer.customerId}
                onChange={(e) => setNewCustomer({...newCustomer, customerId: e.target.value})}
              />
              <input 
                type="text"
                placeholder="Nama Customer"
                value={newCustomer.customerName}
                onChange={(e) => setNewCustomer({...newCustomer, customerName: e.target.value})}
              />
              <input 
                type="text"
                placeholder="Kontak"
                value={newCustomer.customerContact}
                onChange={(e) => setNewCustomer({...newCustomer, customerContact: e.target.value})}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowCustomerModal(false)} className="btn-cancel">
                Batal
              </button>
              <button onClick={setCustomerData} className="btn-save">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
