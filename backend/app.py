import importlib.util
import pkgutil
from flask import Flask, request, jsonify, abort, make_response
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os
import re

if not hasattr(pkgutil, 'get_loader'):
    def get_loader(name):
        if name == '__main__':
            return None
        spec = importlib.util.find_spec(name)
        if spec is None:
            return None

        class LoaderWrapper:
            def __init__(self, spec):
                self._spec = spec

            def is_package(self, fullname=None):
                return self._spec.submodule_search_locations is not None

            def get_filename(self, fullname=None):
                return self._spec.origin

        return LoaderWrapper(spec)

    pkgutil.get_loader = get_loader

app = Flask(__name__)
CORS(app)

DB = os.path.join(os.path.dirname(__file__), 'transactions.db')
API_KEY = os.environ.get('MMT_API_KEY', 'changeme')
PARTNER_API_KEY = os.environ.get('PARTNER_API_KEY', API_KEY)
PHONE_RE = re.compile(r'^\+?\d{7,15}$')


def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            amount REAL NOT NULL,
            direction TEXT NOT NULL CHECK(direction IN ('in','out')),
            wallet_type TEXT NOT NULL DEFAULT 'business',
            provider TEXT,
            vat_rate REAL NOT NULL DEFAULT 0,
            vat_amount REAL NOT NULL DEFAULT 0,
            note TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()

    existing_columns = [row[1] for row in c.execute("PRAGMA table_info(transactions)")]
    if 'wallet_type' not in existing_columns:
        c.execute("ALTER TABLE transactions ADD COLUMN wallet_type TEXT NOT NULL DEFAULT 'business'")
    if 'vat_rate' not in existing_columns:
        c.execute('ALTER TABLE transactions ADD COLUMN vat_rate REAL NOT NULL DEFAULT 0')
    if 'vat_amount' not in existing_columns:
        c.execute('ALTER TABLE transactions ADD COLUMN vat_amount REAL NOT NULL DEFAULT 0')
    conn.commit()
    conn.close()


def get_db_conn():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def require_api_key():
    key = request.headers.get('x-api-key') or request.args.get('api_key')
    if not key or key not in (API_KEY, PARTNER_API_KEY):
        abort(401)


def transactions_to_csv(rows):
    import csv
    from io import StringIO

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Phone', 'Amount', 'Direction', 'Wallet', 'Provider', 'VAT Rate', 'VAT Amount', 'Note', 'Created At'])
    for row in rows:
        writer.writerow([
            row['id'],
            row['phone'],
            row['amount'],
            row['direction'],
            row['wallet_type'],
            row['provider'],
            row['vat_rate'],
            row['vat_amount'],
            row['note'],
            row['created_at']
        ])
    return output.getvalue()


def transactions_to_xls(rows):
    header = ['ID', 'Phone', 'Amount', 'Direction', 'Wallet', 'Provider', 'VAT Rate', 'VAT Amount', 'Note', 'Created At']
    html = ['<table border="1">', '<thead><tr>' + ''.join(f'<th>{col}</th>' for col in header) + '</tr></thead>', '<tbody>']
    for row in rows:
        html.append('<tr>' + ''.join(
            f'<td>{row[col.lower().replace(" ", "_")]}</td>' for col in header
        ) + '</tr>')
    html.append('</tbody></table>')
    return '\n'.join(html)


def vat_summary_to_csv(rows):
    import csv
    from io import StringIO

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Year', 'Month', 'Wallet', 'Turnover', 'VAT Total', 'Transaction Count', 'Tax Authority'])
    for row in rows:
        writer.writerow([
            row['year'],
            row['month'],
            row['wallet_type'],
            row['turnover'],
            row['vat_total'],
            row['transaction_count'],
            row['tax_authority']
        ])
    return output.getvalue()


def validate_transaction_payload(data):
    errors = []
    phone = data.get('phone')
    amount = data.get('amount')
    direction = data.get('direction')
    wallet_type = data.get('wallet_type', 'business')
    provider = data.get('provider', '')
    note = data.get('note', '')
    vat_rate = data.get('vat_rate', 0)

    if not phone or not isinstance(phone, str) or not PHONE_RE.match(phone.strip()):
        errors.append('phone must be a valid phone number (7-15 digits, optional +)')
    try:
        amount = float(amount)
        if amount <= 0:
            errors.append('amount must be greater than 0')
    except Exception:
        errors.append('amount must be a number')
    if direction not in ('in', 'out'):
        errors.append("direction must be 'in' or 'out'")
    if wallet_type not in ('business', 'personal'):
        errors.append("wallet_type must be 'business' or 'personal'")
    try:
        vat_rate = float(vat_rate)
        if vat_rate < 0 or vat_rate > 100:
            errors.append('vat_rate must be between 0 and 100')
    except Exception:
        errors.append('vat_rate must be a number')
    if provider and len(provider) > 100:
        errors.append('provider is too long (max 100 chars)')
    if note and len(note) > 500:
        errors.append('note is too long (max 500 chars)')

    return errors, {
        'phone': phone.strip() if isinstance(phone, str) else phone,
        'amount': amount if isinstance(amount, float) else float(amount) if amount is not None else 0,
        'direction': direction,
        'wallet_type': wallet_type,
        'provider': provider.strip() if isinstance(provider, str) else provider,
        'vat_rate': vat_rate,
        'vat_amount': round(amount * (vat_rate / 100.0), 2) if isinstance(amount, (int, float)) else 0,
        'note': note.strip() if isinstance(note, str) else note
    }


@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': 'Bad Request', 'details': getattr(e, 'description', None)}), 400


@app.errorhandler(401)
def unauthorized(e):
    return jsonify({'error': 'Unauthorized'}), 401


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not Found'}), 404


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify(status='ok')


@app.route('/api/summary', methods=['GET'])
def summary():
    wallet_filter = request.args.get('wallet')
    query = '''
        SELECT wallet_type,
               SUM(CASE WHEN direction='in' THEN amount ELSE -amount END) AS balance,
               SUM(vat_amount) AS vat_total,
               COUNT(*) AS transaction_count
        FROM transactions'''
    params = []
    if wallet_filter in ('business', 'personal'):
        query += ' WHERE wallet_type = ?'
        params.append(wallet_filter)
    query += ' GROUP BY wallet_type'

    conn = get_db_conn()
    c = conn.cursor()
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])


@app.route('/api/vat-summary', methods=['GET'])
def vat_summary():
    wallet_filter = request.args.get('wallet')
    year_filter = request.args.get('year')

    query = '''
        SELECT strftime('%Y', created_at) AS year,
               strftime('%m', created_at) AS month,
               wallet_type,
               SUM(vat_amount) AS vat_total,
               SUM(amount) AS turnover,
               COUNT(*) AS transaction_count
        FROM transactions'''
    conditions = []
    params = []

    if wallet_filter in ('business', 'personal'):
        conditions.append('wallet_type = ?')
        params.append(wallet_filter)

    if year_filter and year_filter.isdigit():
        conditions.append("strftime('%Y', created_at) = ?")
        params.append(year_filter)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)

    query += ' GROUP BY year, month, wallet_type ORDER BY year DESC, month DESC'

    conn = get_db_conn()
    c = conn.cursor()
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    response = []
    for row in rows:
        r = dict(row)
        r['tax_authority'] = 'TRA/KRA' if r['wallet_type'] == 'business' else 'N/A'
        response.append(r)

    return jsonify(response)


@app.route('/api/export/transactions/csv', methods=['GET'])
def export_transactions_csv():
    wallet_filter = request.args.get('wallet')
    conn = get_db_conn()
    c = conn.cursor()
    if wallet_filter in ('business', 'personal'):
        c.execute('''
            SELECT id, phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at
            FROM transactions
            WHERE wallet_type = ?
            ORDER BY created_at DESC
        ''', (wallet_filter,))
    else:
        c.execute('''
            SELECT id, phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at
            FROM transactions
            ORDER BY created_at DESC
        ''')
    rows = c.fetchall()
    conn.close()

    csv_data = transactions_to_csv([dict(row) for row in rows])
    response = make_response(csv_data)
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename=transactions.csv'
    return response


@app.route('/api/export/transactions/excel', methods=['GET'])
def export_transactions_excel():
    wallet_filter = request.args.get('wallet')
    conn = get_db_conn()
    c = conn.cursor()
    if wallet_filter in ('business', 'personal'):
        c.execute('''
            SELECT id, phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at
            FROM transactions
            WHERE wallet_type = ?
            ORDER BY created_at DESC
        ''', (wallet_filter,))
    else:
        c.execute('''
            SELECT id, phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at
            FROM transactions
            ORDER BY created_at DESC
        ''')
    rows = c.fetchall()
    conn.close()

    html_data = transactions_to_xls([dict(row) for row in rows])
    response = make_response(html_data)
    response.headers['Content-Type'] = 'application/vnd.ms-excel'
    response.headers['Content-Disposition'] = 'attachment; filename=transactions.xls'
    return response


@app.route('/api/export/vat/csv', methods=['GET'])
def export_vat_csv():
    wallet_filter = request.args.get('wallet')
    year_filter = request.args.get('year')

    query = '''
        SELECT strftime('%Y', created_at) AS year,
               strftime('%m', created_at) AS month,
               wallet_type,
               SUM(vat_amount) AS vat_total,
               SUM(amount) AS turnover,
               COUNT(*) AS transaction_count
        FROM transactions'''
    conditions = []
    params = []

    if wallet_filter in ('business', 'personal'):
        conditions.append('wallet_type = ?')
        params.append(wallet_filter)

    if year_filter and year_filter.isdigit():
        conditions.append("strftime('%Y', created_at) = ?")
        params.append(year_filter)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)

    query += ' GROUP BY year, month, wallet_type ORDER BY year DESC, month DESC'

    conn = get_db_conn()
    c = conn.cursor()
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    csv_data = vat_summary_to_csv([dict(row) for row in rows])
    response = make_response(csv_data)
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename=vat-summary.csv'
    return response


@app.route('/api/partners/transactions', methods=['GET'])
def partner_transactions():
    require_api_key()
    wallet_filter = request.args.get('wallet')
    year_filter = request.args.get('year')
    query = '''
        SELECT id, phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at
        FROM transactions'''
    conditions = []
    params = []

    if wallet_filter in ('business', 'personal'):
        conditions.append('wallet_type = ?')
        params.append(wallet_filter)

    if year_filter and year_filter.isdigit():
        conditions.append("strftime('%Y', created_at) = ?")
        params.append(year_filter)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)

    query += ' ORDER BY created_at DESC'

    conn = get_db_conn()
    c = conn.cursor()
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])


@app.route('/api/partners/summary', methods=['GET'])
def partner_summary():
    require_api_key()
    wallet_filter = request.args.get('wallet')
    query = '''
        SELECT wallet_type,
               SUM(CASE WHEN direction='in' THEN amount ELSE -amount END) AS balance,
               SUM(vat_amount) AS vat_total,
               COUNT(*) AS transaction_count
        FROM transactions'''
    params = []
    if wallet_filter in ('business', 'personal'):
        query += ' WHERE wallet_type = ?'
        params.append(wallet_filter)
    query += ' GROUP BY wallet_type'

    conn = get_db_conn()
    c = conn.cursor()
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])


@app.route('/api/partners/vat-summary', methods=['GET'])
def partner_vat_summary():
    require_api_key()
    return vat_summary()


@app.route('/api/transactions', methods=['GET', 'POST'])
def transactions():
    if request.method == 'POST':
        # require_api_key()  # uncomment to enable API key protection for POST
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'Missing JSON body'}), 400

        errors, clean = validate_transaction_payload(data)
        if errors:
            return jsonify({'error': 'validation_failed', 'messages': errors}), 400

        created_at = datetime.utcnow().isoformat()
        conn = get_db_conn()
        c = conn.cursor()
        c.execute('''
            INSERT INTO transactions (phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            clean['phone'],
            clean['amount'],
            clean['direction'],
            clean['wallet_type'],
            clean['provider'],
            clean['vat_rate'],
            clean['vat_amount'],
            clean['note'],
            created_at
        ))
        conn.commit()
        last_id = c.lastrowid
        conn.close()

        return jsonify({'success': True, 'id': last_id}), 201

    wallet_filter = request.args.get('wallet')
    conn = get_db_conn()
    c = conn.cursor()
    if wallet_filter in ('business', 'personal'):
        c.execute('''
            SELECT id, phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at
            FROM transactions
            WHERE wallet_type = ?
            ORDER BY created_at DESC
        ''', (wallet_filter,))
    else:
        c.execute('''
            SELECT id, phone, amount, direction, wallet_type, provider, vat_rate, vat_amount, note, created_at
            FROM transactions
            ORDER BY created_at DESC
        ''')
    rows = c.fetchall()
    conn.close()

    transactions_list = [dict(row) for row in rows]
    return jsonify(transactions_list)


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
