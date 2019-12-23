import SocketIO from 'socket.io';
import defaultBoard from './lib/base/board';
import _ from 'lodash';

const connectRoom = (app, io, socket, key) => {
    console.dir(key);
    //  mapping socket => roomId
    const socketToRoomMap = app.get('socketToRoom');
    socketToRoomMap.set(socket.id, key);

    //  mapping socket => session
    const socketToSessionMap = app.get('socketToSession');
    socketToSessionMap.set(socket.id, socket.request.sessionID);

    //  Broadcasting용 room 업데이트
    socket.join(key);

    //  Server용 room 객체 업데이트
    const roomMap = app.get('room');
    const originRoom = roomMap.get(key);

    //  프론트쪽에 room 없는 접근 redirect하는 코드 넣어둘 것
    if(!originRoom) return;

    const room = { ...originRoom };
    const { nickname } = socket.request.session;

    const sessionId = socket.request.sessionID;
    if(room._participant.has(sessionId)) {
        const socketSet = room._participant.get(sessionId);
        socketSet.add(socket.id);
    } else {
        room.participant.push(nickname);
        room._participant.set(sessionId, new Set([socket.id]));

        if(!room._white) {
            room.white = nickname;
            room._white = sessionId;
        } else if(!room._black) {
            room.black = nickname;
            room._black = sessionId;
            //  게임 시작 메시지 보내야 함
        }

        io.of('/room').emit('message', {
            type: 'initialize',
            room: [...roomMap.values()],
        });
    }
    // console.dir(room);

    roomMap.set(key, room);
}

const disconnectRoom = (app, io, socket, key) => {
    //  delete mapping socket => roomId;
    const socketToRoomMap = app.get('socketToRoom');
    socketToRoomMap.delete(socket.id);

    //  delete mapping socket => session
    const socketToSessionMap = app.get('socketToSession');
    socketToSessionMap.delete(socket.id);

    //  Broadcasting용 room 업데이트
    socket.leave(key);

    //  Server용 room 객체 업데이트
    const roomMap = app.get('room');
    const originRoom = roomMap.get(key);

    //  프론트쪽에 room 없는 접근 redirect하는 코드 넣어둘 것
    if(!originRoom) return;

    const room = { ...originRoom };
    const { nickname } = socket.request.session;

    const sessionId = socket.request.sessionID;
    if(room._participant.has(sessionId)) {
        const socketSet = room._participant.get(sessionId);
        socketSet.delete(socket.id);

        if(socketSet.size === 0) {
            room._participant.delete(sessionId);
            if(room._black === sessionId) {
                room._black = null;
                room.black = null;
            }
            if(room._white === sessionId) {
                room._white = null;
                room.white = null;
            }
            
            const index = room.participant.findIndex(ele => ele === nickname);
            if(index >= 0) {
                room.participant.splice(index, 1);
            }

            // console.dir(room);
            roomMap.set(key, room);
            
            io.of('/room').emit('message', {
                type: 'initialize',
                room: [...roomMap.values()],
            });
            
            //  나가는 선택권은 프론트에 주어져야 할 듯
            // if(room._start && (room._black === null || room._white === null)) {
            //     room._destory();
            // }
        }
    } else {
        // console.dir(room);
        // roomMap.set(key, room);
    }
}

export default (server, app, sessionMiddleware) => {
    const io = SocketIO(server);
    
    app.set('io', io);
    app.set('auth', {
        sessions: new Set(),
    });

    app.set('counter', 0);
    app.set('canvas', new Map());
    app.set('chat', new Map());

    app.set('socketToSession', new Map());
    app.set('socketToRoom', new Map());
    app.set('room', new Map());

    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res, next);
    })

    //  subscribe 'Room' Namespace
    const room = io.of('/room');

    room.on('connect', socket => {
        console.dir('-------------socket(room)--------------');
        console.dir(socket.request.sessionID);
        const room = app.get('room');
        
        socket.emit('message', {
            type: 'initialize',
            room: [...room.values()],
        });
        
        socket.on('disconnect', () => {
            console.dir('-------------socketDis(room)--------------');
            console.dir(socket.request.sessionID);
        })
    });

    //  subscribe 'Chat' Namespace
    const chat = io.of('/chat');

    chat.on('connect', socket => {
        console.dir('-------------socket(chat)--------------');
        console.dir(socket.request.sessionID);
        
        //  room join & broadcast
        const key = socket.handshake.query['key'];
        console.dir(key);
        if(!key) return;

        connectRoom(app, io, socket, key);
        
        const { nickname, color } = socket.request.session;
        const socketToSessionMap = app.get('socketToSession');

        //  Broadcast only on the first session of a socket
        chat.in(key).clients((err, clients) => {
            let count = 0;
            clients.forEach(client => {
                if(socketToSessionMap.get(client) === socketToSessionMap.get(socket.id)) {
                    ++count;
                }
            });

            if(count === 1) {
                socket.broadcast.to(key).emit('message', {
                    type: 'change',
                    color,
                    message: `${nickname} join the game`,
                });
            }
        });
        
        //  Broadcast only to my socket
        socket.emit('message', {
            type: 'initialize',
            color,
            message: `welcome ${nickname}`,
        });

        socket.on('disconnect', () => {
            const socketToSessionMap = app.get('socketToSession');

            //  asynchronous function
            chat.in(key).clients((err, clients) => {
                let count = 0;
                clients.forEach(client => {
                    if(socketToSessionMap.get(client) === socketToSessionMap.get(socket.id)) {
                        ++count;
                    }
                });
    
                if(count === 0) {
                    socket.broadcast.to(key).emit('message', {
                        type: 'change',
                        color,
                        message: `${nickname} left the game`,
                    });
                }

                disconnectRoom(app, io, socket, key);
            });

            console.dir('-------------socketDis(chat)--------------');
            console.dir(socket.request.sessionID);
        })
    })

    //  subscribe 'Canvas' Namespace
    const canvas = io.of('/canvas');

    canvas.on('connect', socket => {
        console.dir('-------------socket(canvas)--------------');
        console.dir(socket.request.sessionID);

        //  프론트쪽에 key 없는 접근 redirect하는 코드 넣어둘 것 (서버쪽에서 message를 보내면 좋을 듯)
        const key = socket.handshake.query['key'];
        console.dir(key);
        if(!key) return;
       
        connectRoom(app, io, socket, key);

        //  canvas initialize
        const canvasMap = app.get('canvas');
        let board;
        if(canvasMap.has(key)) {
            board = canvasMap.get(key);
        } else {
            board = _.cloneDeep(defaultBoard);
            canvasMap.set(key, board);
        }

        const roomMap = app.get('room');
        // console.dir(roomMap);
        console.dir(key);
        const room = app.get('room').get(key);
        console.dir(roomMap);
        // if(!room) return;

        socket.emit('message', {
            type: 'initialize',
            board,
            // turn: room.turn,
        })
        
        socket.on('disconnect', () => {
            disconnectRoom(app, io, socket, key);

            console.dir('-------------socketDis(canvas)--------------');
            console.dir(socket.request.sessionID);
        });
    });

    // subscribe 'Auth' Namespace
    const auth = io.of('/auth');
    auth.on('connect', socket => {      
        //  io connection시에는 sessionID가 다르지만, 첫 http request 이후 세션 고정
        //  socket과 http request가 동일한 세션을 공유할 수 있음
        
        console.dir('-------------socket(auth)--------------');
        console.dir(socket.request.sessionID);

        const key = socket.handshake.query['key'];
        console.dir(key);
        if(!key) return;

        connectRoom(app, io, socket, key);

        const { nickname, color } = socket.request.session;
        if(!nickname) return;

        const sessionId = socket.request.sessionID;
        const room = app.get('room').get(key);
        if(!room) return;

        const role = room._black === sessionId ? 'black': (room._white === sessionId ? 'white' : 'spectator');

        // console.dir(room);
        console.dir('auth initialized~!');
        socket.emit('message', {
            type: 'initialize',
            nickname,
            role: 'aaa',
            color,
        });


        // socket.on('message', () => {
        //     console.dir('-------------serveronMessage--------------')
        //     console.dir(socket.request.sessionID);
        // });

        socket.on('disconnect', () => {
            disconnectRoom(app, io, socket, key);
            console.dir('-------------socketDis(auth)--------------')
            console.dir(socket.request.sessionID);
        })
    })
};