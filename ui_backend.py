import socket
from flask import Flask, request
from flask_cors import CORS
from enum import Enum

app = Flask(__name__)

CORS(app)

BASE_PATH = "C:\\Users\\Rick\\Documents\\DT\\"

class AgentActionType(Enum):
    REGISTER_FILE = 1
    UPDATE_PERMISSIONS = 2
    DELETE_FILE = 3

def send_to_agent(data: bytes):
    try:
        print(data)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect(("192.168.132.131", 2512))
            sock.send(data)
            resp = sock.recv(1024)
            print(resp)
            sock.shutdown(socket.SHUT_RDWR)
    except Exception as e:
        print("Error communicating with agent:")
        print(e)
        raise



def serialize_acl(acl_list):
    return '|'.join(
        f"{user['name']};{'\x00' if user['access'] == 'read' else '\x01'}"
        for user in acl_list
    )



@app.route("/register", methods=["POST"])
def register():
    newFile = request.json
    register_data = serialize_acl(newFile['sharedWith'])

    try:
        register_data = chr(AgentActionType.REGISTER_FILE.value).encode() + f"{BASE_PATH}{newFile['name']}$".encode() + register_data.encode() + b"$"
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
        register_data = serialize_acl(file_data['sharedWith'])  

        register_data = chr(AgentActionType.UPDATE_PERMISSIONS.value).encode() + f"{BASE_PATH}{file_data['name']}$".encode() + register_data.encode() + b"$"
        send_to_agent(register_data)
        return {"status": "success"}
    except Exception as e:
        print("Error updating permissions:")
        print(e)
        return {"status": "fail", "error": "Error during permission update process."}, 500


@app.route("/delete/<file_name>" , methods=["DELETE"])
def delete_file(file_name):
    try:
<<<<<<< HEAD
        delete_data = chr(AgentActionType.DELETE_FILE.value).encode() + f"{BASE_PATH}{file_id}$".encode()
=======
        delete_data = AgentActionType.DELETE_FILE.value.to_bytes(1,byteorder='big') + f"{BASE_PATH}{file_name}$".encode()
>>>>>>> 4853756 (fix(delete): send full file name instead of index to agent)
        send_to_agent(delete_data)
        return {"status":"success"}
    except Exception as e:
        print("Error deleting file:")
        print(e)
        return {"status": "fail", "error": "Error during file deleting."}, 500


@app.route("/update-permissions", methods=["POST"])
def update_permissions():
    file_data = request.json

    try:
        register_data = ""
        for user in file_data['sharedWith']:
            register_data += f"{user['name']};{'\x00' if user['access'] == 'read' else '\x01'}|"
        register_data = register_data[:-1]  

        register_data = f"\x02C:\\Users\\Rick\\Documents\\DT\\{file_data['name']}$" + register_data + "$"

        print(register_data.encode())  

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect(("192.168.20.1", 2512))

        sock.send(register_data.encode())
        resp = sock.recv(1024)
        print(resp)

    except Exception as e:
        print("Error sending permissions update:")
        print(e)
        return {"status": "fail", "error": str(e)}, 500

    return {"status": "success"}


app.run(host="0.0.0.0", port="2513", debug=True)