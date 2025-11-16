from flask import Blueprint, request, jsonify
from models import db, bcrypt, User
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity,
    verify_jwt_in_request
)
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import os
from werkzeug.utils import secure_filename
# 'auth'라는 이름의 Blueprint를 생성합니다.
auth_bp = Blueprint('auth', __name__, url_prefix='/api')
UPLOAD_FOLDER = 'uploads/profiles'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
# --- 회원가입 API ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "아이디와 비밀번호가 필요합니다."}), 400

    # 이미 존재하는 사용자인지 확인
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "이미 존재하는 아이디입니다."}), 409

    # 비밀번호 해싱
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    new_user = User(username=username, password_hash=hashed_password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "회원가입 성공"}), 201
    except Exception as e:
        db.session.rollback()
        print(f"[DB 오류] 회원가입 실패: {e}")
        return jsonify({"error": "서버 오류로 회원가입에 실패했습니다."}), 500


# --- 로그인 API ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "아이디와 비밀번호가 필요합니다."}), 400

    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        # JWT 토큰 생성 (user.id를 문자열로 변환!)
        access_token = create_access_token(identity=str(user.id))  # ⬅️ str() 추가!
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"error": "아이디 또는 비밀번호가 잘못되었습니다."}), 401


# --- 보호된 API (마이페이지용) ---
@auth_bp.route('/protected', methods=['GET'])
def protected():
    print("=" * 50)
    print("🔑 받은 Authorization 헤더:", request.headers.get("Authorization"))
    
    try:
        verify_jwt_in_request()
        
        current_user_id = get_jwt_identity()
        print("✅ JWT 검증 성공! 사용자 ID:", current_user_id)
        
        user = User.query.get(int(current_user_id))
        if not user:
            print("❌ 사용자를 DB에서 찾을 수 없음")
            return jsonify({"error": "사용자를 찾을 수 없습니다"}), 404
            
        print("✅ 사용자 찾음:", user.username)
        
        # ⬇️ nickname도 함께 반환
        return jsonify(
            logged_in_as=user.username,  # 로그인 ID
            nickname=user.nickname or user.username  # 닉네임 (없으면 username)
        ), 200
        
    except ExpiredSignatureError:
        print("❌ 토큰 만료")
        return jsonify({"error": "토큰이 만료되었습니다"}), 401
    except InvalidTokenError as e:
        print(f"❌ 유효하지 않은 토큰: {e}")
        return jsonify({"error": "유효하지 않은 토큰입니다"}), 422
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"error": "사용자를 찾을 수 없습니다"}), 404
        
        return jsonify({
            "username": user.username,  # 로그인 ID
            "nickname": user.nickname or user.username,  # 닉네임
            "profile_url": user.profile_url,
            "favorite_hospitals": user.favorite_hospitals or []
        }), 200
        
    except Exception as e:
        print(f"❌ 프로필 조회 오류: {e}")
        return jsonify({"error": str(e)}), 500


# --- 프로필 사진 업로드 ---
@auth_bp.route('/profile/upload', methods=['POST'])
def upload_profile_pic():
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"error": "사용자를 찾을 수 없습니다"}), 404
        
        # 파일 확인
        if 'file' not in request.files:
            return jsonify({"error": "파일이 없습니다"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "파일이 선택되지 않았습니다"}), 400
        
        if file and allowed_file(file.filename):
            # 파일명 생성 (user_id + timestamp)
            filename = secure_filename(f"user_{current_user_id}_{int(os.path.getmtime(__file__))}.{file.filename.rsplit('.', 1)[1].lower()}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            # URL 생성 (백엔드 서버 기준)
            profile_url = f"http://localhost:5001/uploads/profiles/{filename}"
            
            # DB 업데이트
            user.profile_url = profile_url
            db.session.commit()
            
            return jsonify({"profile_url": profile_url}), 200
        
        return jsonify({"error": "허용되지 않는 파일 형식입니다"}), 400
        
    except Exception as e:
        print(f"❌ 프로필 사진 업로드 오류: {e}")
        return jsonify({"error": str(e)}), 500


# --- 닉네임 변경 ---
@auth_bp.route('/profile/nickname', methods=['PUT'])  # ⬅️ URL 변경
def update_nickname():
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"error": "사용자를 찾을 수 없습니다"}), 404
        
        data = request.json
        new_nickname = data.get('nickname')  # ⬅️ 'nickname'으로 변경
        
        if not new_nickname or not new_nickname.strip():
            return jsonify({"error": "닉네임을 입력해주세요"}), 400
        
        # ⬇️ nickname 필드 업데이트 (username은 변경 안 함!)
        user.nickname = new_nickname
        db.session.commit()
        
        return jsonify({"message": "닉네임이 변경되었습니다"}), 200
        
    except Exception as e:
        print(f"❌ 닉네임 변경 오류: {e}")
        return jsonify({"error": str(e)}), 500


# --- 비밀번호 변경 ---
@auth_bp.route('/profile/password', methods=['PUT'])
def update_password():
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"error": "사용자를 찾을 수 없습니다"}), 404
        
        data = request.json
        new_password = data.get('password')
        
        if not new_password or len(new_password) < 6:
            return jsonify({"error": "비밀번호는 최소 6자 이상이어야 합니다"}), 400
        
        # 비밀번호 해싱
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password_hash = hashed_password
        db.session.commit()
        
        return jsonify({"message": "비밀번호가 변경되었습니다"}), 200
        
    except Exception as e:
        print(f"❌ 비밀번호 변경 오류: {e}")
        return jsonify({"error": str(e)}), 500


# --- 즐겨찾는 병원 추가 ---
@auth_bp.route('/favorites', methods=['POST'])
def add_favorite():
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"error": "사용자를 찾을 수 없습니다"}), 404
        
        data = request.json
        hospital_id = data.get('hospital_id')
        
        if not hospital_id:
            return jsonify({"error": "병원 ID가 필요합니다"}), 400
        
        # 즐겨찾기 목록 업데이트
        favorites = user.favorite_hospitals or []
        if hospital_id not in favorites:
            favorites.append(hospital_id)
            user.favorite_hospitals = favorites
            db.session.commit()
        
        return jsonify({"message": "즐겨찾기에 추가되었습니다"}), 200
        
    except Exception as e:
        print(f"❌ 즐겨찾기 추가 오류: {e}")
        return jsonify({"error": str(e)}), 500


# --- 즐겨찾는 병원 제거 ---
@auth_bp.route('/favorites/<int:hospital_id>', methods=['DELETE'])
def remove_favorite(hospital_id):
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"error": "사용자를 찾을 수 없습니다"}), 404
        
        favorites = user.favorite_hospitals or []
        if hospital_id in favorites:
            favorites.remove(hospital_id)
            user.favorite_hospitals = favorites
            db.session.commit()
        
        return jsonify({"message": "즐겨찾기에서 제거되었습니다"}), 200
        
    except Exception as e:
        print(f"❌ 즐겨찾기 제거 오류: {e}")
        return jsonify({"error": str(e)}), 500