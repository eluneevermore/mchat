const express = require('express')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)

  socket.on('offer', ({ offer, peerId }) => {
    console.log('offer', offer)
    io.to(peerId).emit('offer', socket.id, offer)
  })

  socket.on('answer', ({ answer, peerId }) => {
    console.log('answer', answer)
    io.to(peerId).emit('answer', socket.id, answer)
  })

  socket.on('candidate', (candidate) => {
    console.log('candidate', candidate)
    socket.broadcast.emit('candidate', socket.id, candidate)
  })

  socket.on('chat', (message) => {
    console.log('chat', message)
    io.emit('chat', socket.id, message)
  })

  socket.on('join', () => {
    console.log('join', socket.id)
    socket.broadcast.emit('user-joined', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    socket.broadcast.emit('user-disconnected', socket.id)
  })
})

const PORT = process.env.PORT || 10008
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
