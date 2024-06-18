import React, { useState } from 'react'
import { Drawer, Button } from 'antd'
import { useContext } from 'react'
import SocketContext from './SocketContext'
import Chat from './Chat'

const ChatBoard = () => {
  const [show, setShow] = useState(false)
  const socket = useContext(SocketContext)
  const chatProps = Chat.useChat(socket)

  return (
    <>
      <Button onClick={() => setShow(v => !v)}>Chat</Button>
      <Drawer
        open={show}
        onClose={() => setShow(false)}
      >
        <Chat {...chatProps} />
      </Drawer>
    </>
  )
}

export default ChatBoard
