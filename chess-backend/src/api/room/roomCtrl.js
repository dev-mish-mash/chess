//  세션에 해당하는 소켓 객체를 mapper를 이용해 가져다 쓸 수 있다
// const { mapSessionToSocket } = req.app.get('mapper');
// const socket = mapSessionToSocket.get(req.session.id);

import uuid from 'uuid/v1';

export const createRoom = (req, res, next) => {
    const io = req.app.get('io');
    const room = req.app.get('room');
    const size = room.size;

    const genRoom = {
        key: uuid(),
        name: `room${size}`,
        participant: [],
        black: null,
        white: null,
    }

    room.set(genRoom.key, genRoom);

    // //  처음 들어오면 black
    // if(!req.session.role) {
    //     ++counter;
    //     if(counter === 1) {
    //         req.session.role = 'black';
    //     } else if(counter === 2) {
    //         req.session.role = 'white';
    //     } else {
    //         req.session.role = 'spectator';
    //     }        
    // }

    //  change 이벤트로 바꿔야 함
    //  change에서는 room 객체 정보만 전달하자
    io.of('/room').emit('message', {
        type: 'initialize',
        room: [...room.values()],
    });

    res.send(genRoom.key);
    res.status(202).end();
}

export const deleteRoom = (req, res, next) => {
    
    const room = {
        //  지우려는 방의 기존과 동일한 uuid,
    }

    io.of('/room').emit('message', {
        type: 'change',
        room,
    });

    res.send();
    res.status(202).end();
}