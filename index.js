const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

let userCount = 0;

io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);
  userCount++;
  io.emit('user count', userCount);

  socket.on('set nickname', (nickname) => {
    socket.nickname = nickname;
    const message = `🟢 ${nickname} 님이 입장했습니다.`;
    io.emit('chat message', {
      text: message,
      time: getCurrentTime(),
      type: 'system'
    });
  });

  socket.on('chat message', (msg) => {
    // msg가 "닉네임: 내용" 형식이면, 분리해서 객체로 보낼 수도 있고,
    // 아니면 msg에 닉네임을 따로 포함해 보내도 됨
    const nickname = socket.nickname || '익명';

    io.emit('chat message', {
      text: msg,
      sender: nickname,
      time: getCurrentTime()
    });
  });


  socket.on('disconnect', () => {
    console.log('사용자 연결 종료:', socket.id);
    userCount--;
    io.emit('user count', userCount);

    if (socket.nickname) {
      const message = `🔴 ${socket.nickname} 님이 퇴장했습니다.`;
      io.emit('chat message', {
        text: message,
        time: getCurrentTime(),
        type: 'system'
      });
    }
  });
});

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

server.listen(3001, () => {
  console.log('서버가 실행 중입니다! 주소: http://localhost:3001');
});
