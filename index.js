require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI);

const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ MongoDB 연결
const MONGO_URI = 'mongodb+srv://hadu9561:Hadu956132!@cluster0.vmw8p3p.mongodb.net/chatDB?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
 // chatDB는 원하는 DB 이름
  .then(() => console.log('✅ MongoDB 연결 성공!'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ 메시지 스키마/모델 정의
const messageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  time: String,
  type: String
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

// ✅ 클라이언트 정적 파일 서비스
app.use(express.static(path.join(__dirname, 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

let userCount = 0;

io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);
  userCount++;
  io.emit('user count', userCount);
  // ✅ 이전 메시지 보내기
  Message.find().sort({ createdAt: -1 }).limit(80).then(messages => {
    messages.reverse();
    socket.emit('chat history', messages);
  });

  socket.on('set nickname', (nickname) => {
    socket.nickname = nickname;
    const msg = {
      text: `🟢 ${nickname} 님이 입장했습니다.`,
      time: getCurrentTime(),
      type: 'system'
    };
    io.emit('chat message', msg);

    // 저장
    new Message(msg).save().catch(err => console.error('시스템 메시지 저장 실패:', err));
  });

  socket.on('chat message', (msgText) => {
    const nickname = socket.nickname || '익명';
    const messageData = {
      text: msgText,
      sender: nickname,
      time: getCurrentTime(),
      type: 'user'
    };

    io.emit('chat message', messageData);
    new Message(messageData).save().catch(err => console.error('메시지 저장 실패:', err));
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 종료:', socket.id);
    userCount--;
    io.emit('user count', userCount);

    if (socket.nickname) {
      const msg = {
        text: `🔴 ${socket.nickname} 님이 퇴장했습니다.`,
        time: getCurrentTime(),
        type: 'system'
      };
      io.emit('chat message', msg);
      new Message(msg).save().catch(err => console.error('시스템 메시지 저장 실패:', err));
    }
  });
});

// ✅ 시간 포맷 함수
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul'
  });
}


// ✅ 서버 실행
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 실행 중입니다! 포트: ${PORT}`);
});