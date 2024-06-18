import React from 'react'
import io from 'socket.io-client'
import Chat from './Chat'
import VideoCall from './VideoCall'

// const PORT = 10008
// const socket = io('http://localhost:' + PORT)
const socket = window.socket = io()

function App() {
  const chatProps = Chat.useChat(socket)
  const videoCallProps = VideoCall.useVideoCall(socket)

  return (
    <div>
      <VideoCall {...videoCallProps} />
      <Chat {...chatProps} />
    </div>
  )
}

export default React.memo(App)
