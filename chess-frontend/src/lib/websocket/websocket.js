import { eventChannel } from 'redux-saga';
import SocketIo from 'socket.io-client';
import { put, call, take, cancelled } from 'redux-saga/effects';

// eslint-disable-next-line
function* createEventChannel(io) {
    return eventChannel(emit => {
        io.on('connect', socket => {
            emit({
                type: 'socket',
                socket: io.id
            });
        })

        io.on('message', message => {
            emit(message)
        });

        return () => {
            io.close();
        }
    })
}

export function* connectNamespace(params) {
    let channel;

    const {
        url,
        initializeSocket,
        initializeValue,
        changeValue,
        query,
    } = params;

    try {
        const io = SocketIo(url, {
            query,
            reconnection: false,
            secure: true,
        });
        
        channel = yield call(createEventChannel, io);
    
        while(true) {
            const message = yield take(channel);
            console.dir(message);
            switch(message.type) {
                case 'socket':
                    yield put(initializeSocket(message));
                    break;
                case 'initialize':
                    yield put(initializeValue(message));
                    break;
                case 'change':
                    yield put(changeValue(message));
                    break;
                default:
                    console.dir(message);
            }
        }
    } catch(e) {
        console.dir(e);
    } finally {
        if (yield cancelled()) {
            channel.close();
        }
    }
}