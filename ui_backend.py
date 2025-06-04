import socket
from flask import Flask, request, make_response,jsonify
from flask_cors import CORS
from enum import Enum
from functools import wraps
app = Flask(__name__)

CORS(app, supports_credentials=True)

BASE_PATH = "C:\\Users\\alice\\Documents\\DT\\"

class AgentActionType(Enum):
    REGISTER_FILE = 1
    UPDATE_PERMISSIONS = 2
    DELETE_FILE = 3
    LOGIN = 4

def send_to_agent(data: bytes):
    try:
        print(data)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect(("localhost", 2512))
            sock.send(data)
            resp = sock.recv(1024)
            print(resp)
            sock.shutdown(socket.SHUT_RDWR)
            return resp
    except Exception as e:
        print("Error communicating with agent:")
        print(e)
        raise

def serialize_acl(acl_list):
    return '|'.join(
        f"{user['name']};{'0' if user['access'] == 'read' else '1'}"
        for user in acl_list
    )

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('auth_token')
        if not token:
            return jsonify({"status": "fail", "error": "Missing or invalid auth token"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/register", methods=["POST"])
@require_auth
def register():
    newFile = request.json
    register_data = serialize_acl(newFile['acl'])
    token = request.cookies.get("auth_token")

    try:
        register_data = AgentActionType.REGISTER_FILE.value.to_bytes(1, byteorder='big') + f"{BASE_PATH}{newFile['name']}$token={token}$".encode() + register_data.encode() + b"$"
        send_to_agent(register_data)
        return {"status": "success"}
    except Exception as e:
        print("Error in registration:")
        print(e)
        return {"status": "fail", "error": "Error during registration process."}, 500
    
@app.route("/login", methods=["POST"])
def login():
    try:
        login_data = request.json
        username = login_data.get("username")
        password = login_data.get("password")

        if not username or not password:
            return {"status": "fail", "error": "Missing credentials"}, 400

        data = AgentActionType.LOGIN.value.to_bytes(1, byteorder='big') + f"{username}|{password}".encode()
        response = send_to_agent(data)

        if not response:
            return {"status": "fail", "error": "No response from agent"}, 500
        
        if response[0] == 1:
            token = response[1:].decode(errors="ignore")  
            print("Login successful. Message from agent:", token)

            resp = make_response({
                "status": "success",
                "message": "Login successful"
            })
            resp.set_cookie("auth_token", token, httponly=True, secure=False, samesite='Lax')

            return resp, 200
        else:
            return {"status": "fail", "error": "Invalid credentials"}, 401

    except Exception as e:
        print("Error in login:")
        print(e)
        return {"status": "fail", "error": "Error during login process."}, 500

app.run(host="0.0.0.0", port="2513", debug=True)