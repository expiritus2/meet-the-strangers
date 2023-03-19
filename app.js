const express = require('express');
const http = require('http');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

let connectedPeers = [];

io.on('connection', (socket) => {
    connectedPeers.push(socket.id);
    console.log(connectedPeers);

    socket.on('pre-offer', (data) => {
        const { calleePersonalCode, callType } = data;
        const connectedPeer = connectedPeers.find((peerSocketId) => {
            return peerSocketId === calleePersonalCode;
        });

        if (connectedPeer) {
            const data = {
                callerSocketId: socket.id,
                callType
            };
            io.to(calleePersonalCode).emit('pre-offer', data);
        }
    });

    socket.on('pre-offer-answer', (data) => {
        console.log('pre offer answer came');
        console.log(data);
        const { callerSocketId } = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => {
            return peerSocketId === callerSocketId;
        });

        if (connectedPeer) {
            console.log('connectedPeer', connectedPeer);
            io.to(callerSocketId).emit('pre-offer-answer', data);
        }
    });

    socket.on('webRTC-signaling', (data) => {
        const { connectedUserSocketId } = data;
        const connectedPeer = connectedPeers.find((peerSocketId) => {
            return peerSocketId === connectedUserSocketId;
        });

        if (connectedPeer) {
            io.to(connectedUserSocketId).emit('webRTC-signaling', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        connectedPeers = connectedPeers.filter((peerSocketId) => {
            return peerSocketId !== socket.id;
        });
        console.log(connectedPeers);
    });
});

server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});
