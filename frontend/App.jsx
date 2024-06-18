import React from 'react'
import io from 'socket.io-client'
import VideoCall from './VideoCall'
import SocketContext from './SocketContext'
import ChatBoard from './ChatBoard'
import { Layout } from 'antd'

// const PORT = 10008
// const socket = io('http://localhost:' + PORT)
const socket = window.socket = io()

function App() {
  const videoCallProps = VideoCall.useVideoCall(socket)

  return (
    <>
      <SocketContext.Provider value={socket}>
        <Layout>
          <Layout.Content>
            <VideoCall {...videoCallProps} />
          </Layout.Content>
          <Layout.Footer
            style={{
              textAlign: 'right',
              position: 'absolute',
              bottom: 0,
              zIndex: 1,
              width: '100%',
            }}
          >
            <ChatBoard />
          </Layout.Footer>
        </Layout>
      </SocketContext.Provider>
    </>
  )
}

export default React.memo(App)
