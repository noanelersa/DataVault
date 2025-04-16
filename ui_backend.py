import socket
from flask import Flask, request
from flask_cors import CORS
from enum import Enum

app = Flask(__name__)

CORS(app)

class AgentActionType(Enum):
    REGISTER_FILE = b"\x01"
    UPDATE_PERMISSIONS = b"\x02"

def send_to_agent(data: bytes):
    try:
        print(data)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect(("192.168.20.1", 2512))
            sock.send(data)
            resp = sock.recv(1024)
            print(resp)
    except Exception as e:
        print("Error communicating with agent:")
        print(e)
        raise



def build_shared_with_string(shared_with_list):
    return '|'.join(
        f"{user['name']};{'\x00' if user['access'] == 'read' else '\x01'}"
        for user in shared_with_list
    )


@app.route("/register", methods=["POST"])
def register():
    newFile = request.json
    register_data = build_shared_with_string(newFile['sharedWith'])

    try:
        register_data = AgentActionType.REGISTER_FILE.value + f"C:\\Users\\Rick\\Documents\\DT\\{newFile['name']}$".encode() + register_data.encode() + b"$"
        send_to_agent(register_data)
        return {"status": "success"}
    except Exception as e:
        print("Error in registration:")
        print(e)
        return {"status": "fail", "error": "Error during registration process."}, 500


@app.route("/update-permissions", methods=["POST"])
def update_permissions():
    file_data = request.json

    try:
        register_data = build_shared_with_string(file_data['sharedWith'])  

        register_data = AgentActionType.UPDATE_PERMISSIONS.value + f"C:\\Users\\Rick\\Documents\\DT\\{file_data['name']}$".encode() + register_data.encode() + b"$"
        send_to_agent(register_data)
        return {"status": "success"}
    except Exception as e:
        print("Error updating permissions:")
        print(e)
        return {"status": "fail", "error": "Error during permission update process."}, 500


app.run(host="0.0.0.0", port="2513", debug=True)