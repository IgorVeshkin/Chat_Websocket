import { useEffect, useState } from 'react'

import { io, Socket } from "socket.io-client"

import './App.css'

interface MessageInputFormProps {
  message: string,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setMessageList: React.Dispatch<React.SetStateAction<string[]>>
  textfieldID: string,
  ioSocket: Socket | null,
}

const MessageInputForm: React.FC<MessageInputFormProps> = ({ message, setMessage, setMessageList, textfieldID, ioSocket }) => {

  const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {

    setMessage(e.target.value);

  }

  const handleMessageSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()

    if (ioSocket && message.trim()) {

      ioSocket.emit("message", message)
      setMessageList(prev => [...prev, message])
      setMessage("")
      
    }
    
  }

  const handleFormRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {

    e.preventDefault();

    setMessage("");

  }

  return (<form onSubmit={handleMessageSubmit} ><input 
            id={textfieldID}
            value={message}
            onChange={handleMessageInput}
            placeholder='Enter message....'
  />

  <button type="submit">Send</button>
  <button onClick={handleFormRefresh}>Reset</button>
  </form>)

}

function App() {

  const [messageList, setMessageList] = useState<string[]>([])
  const [message, setMessage] = useState<string>("")
  
  const websocketServerURL = "ws://127.01.01:8000"

  const [socket, setSocket] = useState<Socket | null>(null)


  useEffect(() => {

    const socketInstance: Socket = io(websocketServerURL)

    setSocket(socketInstance);

    socketInstance.on("message", (msg) => {

      setMessageList(prev => [...prev, msg])

    })

    return(() => {

      socketInstance.disconnect()

    })

  }, [])

  return (
    <>
      <section>
        <h2>If you see this message then everything works fine</h2>

        {
          messageList?.map((msg: string) => (
            <h3>{msg}</h3>
          ))
        }
      </section>

      <MessageInputForm 
        message={message} 
        setMessage={setMessage} 
        setMessageList={setMessageList}
        textfieldID="messageTextInput" 
        ioSocket={socket}
        />
    </>
  )
}

export default App
