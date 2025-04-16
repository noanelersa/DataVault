import socket
from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

@app.route("/register", methods=["POST"])
def register():
    newFile = request.json

    # Initialize the register_data string
    register_data = ""

    # Iterate through the sharedWith list and build the register_data string
    for user in newFile['sharedWith']:
        register_data += f"{user['name']};{'\x00' if user['access'] == 'read' else '\x01'}|"

    # Remove the last '|' character
    register_data = register_data[:-1]

    # Format the final string
    register_data = f"\x01C:\\Users\\Rick\\Documents\\DT\\{newFile['name']}$" + register_data + "$"

    print(register_data.encode())
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect(("192.168.20.1", 2512))

        sock.send(register_data.encode())
        resp = sock.recv(1024)
        print(resp)
    except Exception as e:
        print("FUCK?")
        print(e)

    return "{\"FUCK\":\"YOU\"}"


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