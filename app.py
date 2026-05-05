import os
from flask import Flask, render_template, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# تحديد مسار المشروع بدقة لضمان مكان حفظ الداتا بيز
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

# إعداد قاعدة البيانات (استخدام المسار المطلق)
db_path = os.path.join(BASE_DIR, 'orders.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
with app.app_context():
    db.create_all()
    
# تعريف موديل الطلبات
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    product_name = db.Column(db.String(100))
    size = db.Column(db.String(50))
    flavor = db.Column(db.String(50))
    quantity = db.Column(db.Integer)
    price = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# الصفحة الرئيسية
@app.route('/')
def index():
    return render_template('index.html')

# استقبال الطلبات الجديدة من المودال (الذي أعددناه في JS)
@app.route('/place_order', methods=['POST'])
def place_order():
    try:
        data = request.get_json()
        
        # إنشاء سجل جديد
        new_order = Order(
            customer_name=data.get('customer_name'),
            customer_phone=data.get('customer_phone'),
            product_name=data.get('product_name'),
            size=data.get('size'),
            flavor=data.get('flavor'),
            quantity=data.get('quantity'),
            price=data.get('total_price')
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        return jsonify({"status": "success", "message": "تم تسجيل طلبك بنجاح!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

# API للبحث عن الطلبات (الاستعلام)
@app.route('/api/get_orders', methods=['POST'])
def get_orders():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'لم يتم استقبال بيانات'}), 400

        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()

        print(f"--- Searching: name=[{name}] | phone=[{phone}] ---")


        if not name or not phone:
            return jsonify({'success': False, 'message': 'الاسم والرقم مطلوبان'}), 400

        orders_query = Order.query.filter(
            Order.customer_name.ilike(f"%{name}%"),
            Order.customer_phone == phone
        ).all()

        print(f"--- Found: {len(orders_query)} orders ---")

        orders_list = []
        for order in orders_query:
            orders_list.append({
                'product_name': order.product_name,
                'size': order.size,
                'flavor': order.flavor,
                'quantity': order.quantity,
                'price': order.price,
                'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
                

            })

        return jsonify({'success': True, 'orders': orders_list})

    except Exception as e:
        print(f"--- خطأ في get_orders: {str(e)} ---")
        return jsonify({'success': False, 'message': str(e)}), 500

# التنقل التلقائي بين الصفحات مع معالجة الأخطاء
@app.route('/<page_name>')
def pages(page_name):
    if not page_name.endswith(".html"):
        page_name += ".html"
    
    try:
        return render_template(page_name)
    except:
        abort(404) # لو الصفحة مش موجودة يرجع 404 بدل Error 500

# تشغيل السيرفر وإنشاء الداتا بيز
if __name__ == '__main__':
    with app.app_context():
        db.create_all() # إنشاء الجداول عند التشغيل لأول مرة
    app.run(debug=True, port=5000)