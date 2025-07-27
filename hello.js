const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 서버가 잘 작동 중인지 확인하는 간단한 코드
app.get('/', (req, res) => {
  res.send('서버가 잘 작동하고 있어요!');
});

io.on('connection', (socket) => {
  console.log('누군가 연결되었습니다:', socket.id);

  socket.on('message', (msg) => {
    console.log('받은 메시지:', msg);
    socket.broadcast.emit('message', msg); // 다른 사람에게 전달
  });
});

server.listen(3001, () => {
  console.log('서버가 실행 중입니다! 주소: http://localhost:3001');
});
