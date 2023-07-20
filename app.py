# app.py
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask import render_template

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
db = SQLAlchemy(app)
socketio = SocketIO(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    team = db.Column(db.String(10), nullable=False)
    color = db.Column(db.String(10), nullable=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/submit', methods=['POST'])
def submit():
    user = User(
        name=request.form['name'],
        team=request.form['team'],
        color=None
    )
    db.session.add(user)
    db.session.commit()
    return {'id': user.id}

@app.route('/color', methods=['POST'])
def color():
    user = User.query.get(request.form['id'])
    user.color = request.form['color']
    db.session.commit()
    socketio.emit('color change', {'id': user.id, 'color': user.color})
    return {'success': True}

@app.route('/get_users', methods=['GET'])
def get_users():
    users = User.query.all()
    return {'users': [{'id': user.id, 'name': user.name, 'team': user.team, 'color': user.color} for user in users]}

@app.route('/clear', methods=['POST'])
def clear():
    try:
        users = User.query.all()
        for user in users:
            user.color = None  # or 'white'
            socketio.emit('clear color', {'id': user.id})  # Emit a 'clear color' event for each user
        db.session.commit()
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500
    return {'success': True}

@app.route('/delete_user', methods=['POST'])
def delete_user():
    user = User.query.get(request.form['id'])
    if user:
        db.session.delete(user)
        db.session.commit()
        return {'success': True}
    else:
        return {'success': False, 'error': 'User not found'}, 404

@app.route('/delete_all_users', methods=['POST'])
def delete_all_users():
    try:
        num_rows_deleted = db.session.query(User).delete()
        db.session.commit()
        return {'success': True, 'deleted': num_rows_deleted}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app)
