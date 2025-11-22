from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

active_rooms = {}

@socketio.on('join')
def on_join(data):
    room = data.get('room', '')
    username = data.get('username', 'Anonymous')

    if not room:
        emit('error', {'message': 'Room code is required'})
        return

    join_room(room)

    if room not in active_rooms:
        active_rooms[room] = []

    active_rooms[room].append(request.sid)

    print(f"{username} (sid: {request.sid}) joined room {room}")

    emit('ready', {'user': username, 'room': room}, room=room, skip_sid=request.sid)

@socketio.on('signal')
def on_signal(data):
    room = data.get('room', '')
    signal_data = data.get('signal', {})

    if not room:
        emit('error', {'message': 'Room code is required'})
        return

    emit('signal', signal_data, room=room, skip_sid=request.sid)

@socketio.on('disconnect')
def on_disconnect():
    for room, sids in list(active_rooms.items()):
        if request.sid in sids:
            sids.remove(request.sid)
            leave_room(room)
            emit('peer_left', {'sid': request.sid}, room=room)
            print(f"Client {request.sid} left room {room}")

            if not sids:
                del active_rooms[room]
                print(f"Room {room} is now empty and removed")

if __name__ == "__main__":
    print("Starting signaling server on http://0.0.0.0:5000")
    print("Use ngrok to expose this server: ngrok http 5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
