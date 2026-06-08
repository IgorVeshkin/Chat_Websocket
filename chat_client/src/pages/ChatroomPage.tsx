import { useEffect, useRef, useState } from 'react'

import useFetchData from '../hooks/useFetchData';

import { useLoggedUserData } from '../ProtectedRoute';

// Понять как лучше переместить тип данных залогиненого пользователя
interface loggedUser {
    username: string,
    first_name: string,
    last_name: string,
    is_auth: boolean,
}


type messageType = {
    username: string,
    first_name: string,
    last_name: string,
    is_auth: boolean,
    message: string,
    message_datetime: string,
}


interface MessageInputFormProps {
  message: string,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setMessageList: React.Dispatch<React.SetStateAction<messageType[]>>,
  textfieldID: string,
  webSocket: WebSocket | null,
  userData: loggedUser | null,
}

// Функция для форматирования даты и времени сообщений на frontend-е
const datetimeParser = (msg_date: Date) => {

    const pad = (num: number | string) => String(num).padStart(2, '0');

    const message_date = new Date(msg_date)
    
    const day = pad(message_date.getDate())
    const month = pad(message_date.getMonth() + 1)
    const year = message_date.getFullYear()
    const hours = pad(message_date.getHours())
    const minutes = pad(message_date.getMinutes())

    return `${day}.${month}.${year} ${hours}:${minutes}`

}

const MessageInputForm: React.FC<MessageInputFormProps> = ({ message, setMessage, setMessageList, textfieldID, webSocket, userData }) => {

  const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {

    setMessage(e.target.value);

  }

  const handleMessageSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()

    if (webSocket && message.trim()) {

      const msg_date = new Date()

      const formattedDateTime = datetimeParser(msg_date)

      const dataToBeSent = JSON.stringify({...userData, message: message, message_datetime: msg_date})

      webSocket.send(dataToBeSent)

      setMessageList(prev => [...prev, {...JSON.parse(dataToBeSent), message_datetime: formattedDateTime }])
      setMessage("")
      
    }
    
  }

  const handleFormRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {

    e.preventDefault();

    setMessage("");

  }

  return (<form onSubmit={handleMessageSubmit} style={{ marginBottom: 10, }}><input 
            id={textfieldID}
            value={message}
            onChange={handleMessageInput}
            placeholder='Enter message....'
  />

  <button type="submit">Send</button>
  <button onClick={handleFormRefresh}>Reset</button>
  </form>)

}

function ChatroomPage() {

  const [messageList, setMessageList] = useState<messageType[]>([])
  const [message, setMessage] = useState<string>("")

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const isFirstRender = useRef<boolean>(true)

  // Каждый раз как добавляется новое сообщение прокручиваю вниз переписку к новому сообщению (side-effect)
  useEffect(()=> {

    // Не делаю прокрутку при первоначальной подгрузке страницы 
    if (isFirstRender.current) {

      isFirstRender.current = false
      return

    }

    if (messagesContainerRef.current) {
      
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      })

    }

  }, [messageList])

  const { loggedUserData } = useLoggedUserData()
  

  // Кастомный хук для получении данных текущего чата
  interface Chatroom {
    chatroom: {
      uuid: string,
      title: string,
      coverImage: string,
      users_list: Array<Object>,
      created_by: Object,
    }
  }

  const chatroomURL = useRef<string>("http://127.0.0.1:8000/api/chatroom/")

  const { data: chatroomData, loading: chatroomLoading, error: chatroomError } = useFetchData<Chatroom>(chatroomURL.current)

  // Websocket
  // Все url-адреса должны быть 127.0.0.1, а не localhost, чтобы cookies передавались через websocket
  var websocketServerURL = "ws://127.0.0.1:8000/ws/testing/?chatroom_uuid="

  const socketRef = useRef<WebSocket | null>(null)


  // Работа websocket
  useEffect(() => {

    // Данные uuid чата еще не получены
    if (!chatroomData?.chatroom?.uuid) {
      return;
    }

    const websocketServerURLWithParams = `${websocketServerURL}${chatroomData?.chatroom.uuid}`

    const socketInstance: WebSocket | null = new WebSocket(websocketServerURLWithParams)

    socketRef.current = socketInstance;

    socketInstance.onopen = () => {
      console.log('Client has been connected....');
    };

    socketInstance.onmessage = (event) => {

      const message = JSON.parse(event.data)

      setMessageList(prev => [...prev, {...message, message_datetime: datetimeParser(message.message_datetime)}])

    }

    socketInstance.onclose = () => {
      console.log('Client has been disconnected');
    };

    socketInstance.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return(() => {

      socketInstance.close()

    })

  }, [chatroomData])

  return (
    <div className="page">
      <section>
        <h2>If you see this message then everything works fine</h2>
        {!chatroomLoading &&
        
          <section>
            <h2>{ chatroomData?.chatroom?.title }</h2>
            {/* <img src={`http://127.0.0.1:8000${ chatroomData?.chatroom?.coverImage }`} /> */}
          </section>

        }

        {chatroomError && 
          <h3 style={{ color: 'red', }}>Ошибка получения данных чата: { chatroomError } </h3>
        }
        

        { loggedUserData && <p>Currently logged user: @{loggedUserData.username}</p> }  

      </section>
        
      <section id="messagesContainer" ref={messagesContainerRef}>
        {
          messageList?.map((msg: messageType) => (
            
            <section style={{ boxSizing: "border-box", width: "fit-content", maxWidth: "100%", display: "flex", flexDirection: "column", rowGap: "0.5em", backgroundColor: "whitesmoke", border: "1px lightgray solid", borderRadius: "6px", padding: "0.5em 0.35em 0.5em 0.35em", margin: "0.5em 0 0.5em 0", }}>
              <div style={{ margin: "0.15em 0 0 0" }}>@{msg.username}</div>
              <div style={{ margin: "0.15em 0 0 0", height: "min-content" }}>{msg.message}</div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>{msg.message_datetime}</div>
            </section>
          ))
        }   
      </section>     
      

      <MessageInputForm 
        message={message} 
        setMessage={setMessage} 
        setMessageList={setMessageList}
        textfieldID="messageTextInput" 
        webSocket={socketRef.current}
        userData={loggedUserData}
        />
    </div>
  )
}

export default ChatroomPage
