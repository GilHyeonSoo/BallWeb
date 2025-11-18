from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, bcrypt, User
from dotenv import load_dotenv
import os
from werkzeug.utils import secure_filename
import time
load_dotenv()
from datetime import timedelta

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/uploads/*": {
        "origins": ["http://localhost:5173"]
    }
})
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-jwt-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # ← 이 부분 수정
# DB 설정
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, '..', 'animalloo_en_db.sqlite')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 파일 업로드 설정
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB 제한

# uploads 폴더 생성
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()

# 파일 확장자 체크
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========== API 라우트 ==========

# 회원가입
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': '아이디와 비밀번호를 입력해주세요.'}), 400

    if len(password) < 6:
        return jsonify({'error': '비밀번호는 6자 이상이어야 합니다.'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': '이미 존재하는 아이디입니다.'}), 400

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': '회원가입 성공!'}), 201

# 로그인
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({'error': '아이디 또는 비밀번호가 올바르지 않습니다.'}), 401

    access_token = create_access_token(identity=username)
    return jsonify({'access_token': access_token}), 200

# 프로필 조회
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    
    if not user:
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404

    return jsonify({
        'username': user.username,
        'nickname': user.nickname or user.username,
        'profile_url': user.profile_url
    }), 200

def safe_filename(original_filename):
    """
    한글 파일명을 안전하게 처리
    원본: 군산대.png
    결과: timestamp_랜덤숫자.png
    """
    if not original_filename or '.' not in original_filename:
        return None
    
    # 확장자 분리
    file_ext = original_filename.rsplit('.', 1)[1].lower()
    
    # 허용된 확장자 체크
    if file_ext not in ALLOWED_EXTENSIONS:
        return None
    
    # 타임스탬프 기반 새 파일명 생성
    import random
    new_name = f"{int(time.time())}_{random.randint(1000, 9999)}.{file_ext}"
    return new_name

# 프로필 이미지 업로드 (수정)
@app.route('/api/profile/upload', methods=['POST'])
@jwt_required()
def upload_profile():
    current_user = get_jwt_identity()
    
    print(f"[DEBUG] 업로드 요청 - 사용자: {current_user}")
    
    if 'file' not in request.files:
        print("[ERROR] 'file' 키가 request.files에 없음")
        return jsonify({'error': '파일이 없습니다.'}), 400
    
    file = request.files['file']
    print(f"[DEBUG] 원본 파일명: {file.filename}")
    
    if file.filename == '':
        print("[ERROR] 파일명이 비어있음")
        return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400
    
    # 한글 파일명 처리
    new_filename = safe_filename(file.filename)
    
    if not new_filename:
        print(f"[ERROR] 파일명 처리 실패: {file.filename}")
        return jsonify({'error': '잘못된 파일 형식입니다. (png, jpg, jpeg, gif, webp만 가능)'}), 400
    
    print(f"[DEBUG] 새 파일명: {new_filename}")
    
    # 사용자 정보 가져오기
    user = User.query.filter_by(username=current_user).first()
    if not user:
        print(f"[ERROR] 사용자 없음: {current_user}")
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404
    
    # 사용자 ID 추가
    user_filename = f"user_{user.id}_{new_filename}"
    print(f"[DEBUG] 최종 파일명: {user_filename}")
    
    # 파일 저장
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], user_filename)
    print(f"[DEBUG] 저장 경로: {file_path}")
    
    try:
        file.save(file_path)
        print(f"[SUCCESS] 파일 저장 완료: {file_path}")
    except Exception as e:
        print(f"[ERROR] 파일 저장 실패: {e}")
        return jsonify({'error': f'파일 저장 실패: {str(e)}'}), 500
    
    # DB에 URL 저장
    profile_url = f"http://localhost:5001/uploads/{user_filename}"
    print(f"[DEBUG] DB 저장 URL: {profile_url}")
    
    user.profile_url = profile_url
    db.session.commit()
    
    print(f"[SUCCESS] 업로드 완료!")
    return jsonify({'profile_url': profile_url}), 200

# 업로드된 파일 제공
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 닉네임 변경
@app.route('/api/profile/nickname', methods=['PUT'])
@jwt_required()
def change_nickname():
    current_user = get_jwt_identity()
    data = request.get_json()
    new_nickname = data.get('nickname')

    if not new_nickname or not new_nickname.strip():
        return jsonify({'error': '닉네임을 입력해주세요.'}), 400

    user = User.query.filter_by(username=current_user).first()
    if not user:
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404

    user.nickname = new_nickname
    db.session.commit()

    return jsonify({'message': '닉네임이 변경되었습니다.'}), 200

# 비밀번호 변경 (기존 비밀번호 확인)
@app.route('/api/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    current_password = data.get('current_password')  # 기존 비밀번호
    new_password = data.get('new_password')          # 새 비밀번호

    # 입력 검증
    if not current_password:
        return jsonify({'error': '기존 비밀번호를 입력해주세요.'}), 400

    if not new_password or len(new_password) < 6:
        return jsonify({'error': '새 비밀번호는 6자 이상이어야 합니다.'}), 400

    # 사용자 조회
    user = User.query.filter_by(username=current_user).first()
    if not user:
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404

    # 기존 비밀번호 확인
    if not user.check_password(current_password):
        return jsonify({'error': '기존 비밀번호가 일치하지 않습니다.'}), 401

    # 새 비밀번호 설정
    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': '비밀번호가 변경되었습니다.'}), 200
# 비밀번호 확인 (변경 전 검증용)
@app.route('/api/profile/verify-password', methods=['POST'])
@jwt_required()
def verify_password():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    password = data.get('password')

    if not password:
        return jsonify({'error': '비밀번호를 입력해주세요.'}), 400

    user = User.query.filter_by(username=current_user).first()
    if not user:
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404

    # 비밀번호 확인
    if not user.check_password(password):
        return jsonify({'error': '비밀번호가 일치하지 않습니다.'}), 401

    return jsonify({'message': '비밀번호가 확인되었습니다.'}), 200



@app.route('/')
def index():
    return jsonify({'message': 'Backend is running with Animalloo DB!'})



if __name__ == '__main__':
    app.run(debug=True, port=5001)
