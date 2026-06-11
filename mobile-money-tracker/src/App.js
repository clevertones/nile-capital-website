import React, { useEffect, useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [txs, setTxs] = useState([]);
  const [vatSummary, setVatSummary] = useState([]);
  const [form, setForm] = useState({ phone: '', amount: '', direction: 'in', wallet_type: 'business', provider: '', vat_rate: '0', note: '' });
  const [walletFilter, setWalletFilter] = useState('all');
  const [vatYear, setVatYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  const fetchTxs = async (wallet = walletFilter) => {
    setLoading(true);
    const url = wallet === 'all' ? `${API_BASE}/transactions` : `${API_BASE}/transactions?wallet=${wallet}`;
    const res = await fetch(url);
    const data = await res.json();
    setTxs(data);
    setLoading(false);
  };

  const fetchVatSummary = async (year = vatYear) => {
    const res = await fetch(`${API_BASE}/vat-summary?wallet=business&year=${year}`);
    const data = await res.json();
    setVatSummary(data);
  };

  useEffect(() => { fetchTxs(); fetchVatSummary(vatYear); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount || 0), vat_rate: parseFloat(form.vat_rate || 0) })
    });
    setForm({ phone: '', amount: '', direction: 'in', wallet_type: 'business', provider: '', vat_rate: '0', note: '' });
    fetchTxs();
    fetchVatSummary(vatYear);
  };

  const onWalletFilterChange = async (value) => {
    setWalletFilter(value);
    await fetchTxs(value);
  };

  const onVatYearChange = async (value) => {
    setVatYear(value);
    await fetchVatSummary(value);
  };

  const downloadReport = async (endpoint, filename, includeYear = false) => {
    let query = walletFilter === 'all' ? '' : `?wallet=${walletFilter}`;
    if (includeYear) {
      query += query ? `&year=${vatYear}` : `?year=${vatYear}`;
    }
    const response = await fetch(`${API_BASE}/${endpoint}${query}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const summary = txs.reduce((acc, tx) => {
    const total = acc.total + (tx.direction === 'in' ? tx.amount : -tx.amount);
    const vat = acc.vat + (tx.vat_amount || 0);
    const wallets = { ...acc.wallets };
    wallets[tx.wallet_type] = wallets[tx.wallet_type] || { count: 0, balance: 0, vat: 0 };
    wallets[tx.wallet_type].count += 1;
    wallets[tx.wallet_type].balance += tx.direction === 'in' ? tx.amount : -tx.amount;
    wallets[tx.wallet_type].vat += tx.vat_amount || 0;
    return { total, vat, wallets };
  }, { total: 0, vat: 0, wallets: {} });

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  return (
    <div className="App" style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
      <h1>Mobile Money Tracker</h1>

      <section className="tracker-panel">
        <h2>New Transaction</h2>
        <form onSubmit={submit} className="transaction-form">
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          <input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          <div className="row-grid">
            <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
              <option value="in">In</option>
              <option value="out">Out</option>
            </select>
            <select value={form.wallet_type} onChange={e => setForm({ ...form, wallet_type: e.target.value })}>
              <option value="business">Business Wallet</option>
              <option value="personal">Personal Wallet</option>
            </select>
            <input placeholder="VAT Rate (%)" type="number" step="0.01" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: e.target.value })} />
          </div>
          <input placeholder="Provider" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} />
          <input placeholder="Note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          <button type="submit">Add Transaction</button>
        </form>
      </section>

      <section className="summary-panel">
        <h2>Wallet Summary</h2>
        <div className="summary-row">
          <div><strong>Total Balance:</strong> {summary.total.toFixed(2)}</div>
          <div><strong>Total VAT:</strong> {summary.vat.toFixed(2)}</div>
        </div>
        <div className="wallet-summary-grid">
          {Object.entries(summary.wallets).map(([wallet, stats]) => (
            <div key={wallet} className="wallet-card">
              <h3>{wallet === 'business' ? 'Business Wallet' : 'Personal Wallet'}</h3>
              <p>Transactions: {stats.count}</p>
              <p>Balance: {stats.balance.toFixed(2)}</p>
              <p>VAT: {stats.vat.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="vat-summary-panel">
        <div className="vat-summary-header">
          <h2>VAT Summary (TRA / KRA)</h2>
          <div className="vat-controls">
            <label>
              Year
              <select value={vatYear} onChange={e => onVatYearChange(e.target.value)}>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          </div>
        </div>
        {vatSummary.length === 0 ? (
          <p>No VAT summary available for the selected year.</p>
        ) : (
          <table className="summary-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Month</th>
                <th>Wallet</th>
                <th>Turnover</th>
                <th>VAT Total</th>
                <th>Tax Authority</th>
              </tr>
            </thead>
            <tbody>
              {vatSummary.map(item => (
                <tr key={`${item.year}-${item.month}-${item.wallet_type}`}>
                  <td>{item.year}</td>
                  <td>{item.month}</td>
                  <td>{item.wallet_type}</td>
                  <td>{item.turnover.toFixed(2)}</td>
                  <td>{item.vat_total.toFixed(2)}</td>
                  <td>{item.tax_authority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="transactions-panel">
        <div className="transactions-header">
          <div>
            <h2>Transactions</h2>
            <p className="muted">Use export buttons to download CSV or Excel reports.</p>
          </div>
          <div className="header-actions">
            <button type="button" onClick={() => downloadReport('export/transactions/csv', 'transactions.csv')}>Export CSV</button>
            <button type="button" onClick={() => downloadReport('export/transactions/excel', 'transactions.xls')}>Export Excel</button>
            <button type="button" onClick={() => downloadReport('export/vat/csv', 'vat-summary.csv', true)}>Export VAT CSV</button>
          </div>
        </div>
        <div className="transactions-header">
          <select value={walletFilter} onChange={e => onWalletFilterChange(e.target.value)}>
            <option value="all">All Wallets</option>
            <option value="business">Business Wallet</option>
            <option value="personal">Personal Wallet</option>
          </select>
        </div>

        {loading ? <p>Loading...</p> : (
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Phone</th>
                <th>Wallet</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>VAT</th>
                <th>Provider</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {txs.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td>{t.phone}</td>
                  <td>{t.wallet_type}</td>
                  <td>{t.direction}</td>
                  <td>{t.amount}</td>
                  <td>{(t.vat_amount || 0).toFixed(2)}</td>
                  <td>{t.provider}</td>
                  <td>{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="partner-panel">
        <h2>Partner Open API</h2>
        <p>Authorized partners can retrieve transaction feeds and VAT summaries using an API key.</p>
        <pre className="api-snippet">
{`GET ${API_BASE}/partners/transactions?wallet=business&year=${vatYear}
GET ${API_BASE}/partners/summary
GET ${API_BASE}/partners/vat-summary?year=${vatYear}

Header: x-api-key: YOUR_SECRET_KEY`}
        </pre>
      </section>
    </div>
  );
}

export default App;
