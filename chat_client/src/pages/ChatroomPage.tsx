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
    message_uuid: string,
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

      const messageUUID = crypto.randomUUID()

      // Не забыть сделать проверку на поддержку браузера crypto либо скачать сторонюю библиотеку
      // action нужно только для сервера
      const dataToBeSent = JSON.stringify({...userData, message: message, action: "send_message", message_datetime: msg_date, message_uuid: messageUUID })

      webSocket.send(dataToBeSent)

      setMessageList(prev => [...prev, {...JSON.parse(dataToBeSent), message_datetime: formattedDateTime, message_uuid: messageUUID }])
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
  const messageListLengthRef = useRef<number>(0)

  const isFirstRender = useRef<boolean>(true)

  // Каждый раз как добавляется новое сообщение прокручиваю вниз переписку к новому сообщению (side-effect)
  useEffect(()=> {

    // Не делаю прокрутку при первоначальной подгрузке страницы 
    if (isFirstRender.current) {

      isFirstRender.current = false
      return

    }

    const messagesCount = messageList.length

    // Скроллю страницу только если было добавлено сообщение
    if (messagesContainerRef.current && messagesCount > messageListLengthRef.current) {
      
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      })

    }

    messageListLengthRef.current = messagesCount

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

      if (message.action === "delete_message") {

        setMessageList((prevMessageList) =>

          prevMessageList.filter((curMessage) => curMessage.message_uuid !== message.message_uuid)
        
        )

        return
        
      }

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


  // Удаление сообщения из чата
  const handleMessageDelete = (e: React.MouseEvent<HTMLButtonElement>) => {

    e.preventDefault()

    const button = e.currentTarget as HTMLButtonElement
    const messageUUID = button.dataset.messageId

    const msg_date = new Date()
    const formattedDateTime = datetimeParser(msg_date)

    if (socketRef.current) {
    
      socketRef.current.send(JSON.stringify({
        ...loggedUserData,
        action: "delete_message",
        message_datetime: formattedDateTime,
        message_uuid: messageUUID,
      }))


      setMessageList((prevMessageList) =>

        prevMessageList.filter((curMessage) => curMessage.message_uuid !== messageUUID)
      
      )


    }


  }

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
          messageList?.map((msg: messageType) => {
            
            const isMyMessage = loggedUserData?.username === msg.username

            return (
            <section key={msg.message_uuid} style={{ alignSelf: isMyMessage ? "flex-start" : "flex-end", boxSizing: "border-box", width: "fit-content", maxWidth: "100%", display: "flex", flexDirection: "column", rowGap: "0.5em", backgroundColor: isMyMessage ? "#E5FDE2" : "#E3F2FD", border: "1px lightgray solid", borderRadius: "6px", padding: "0.5em 0.35em 0.5em 0.35em", margin: "0.5em 0 0.5em 0", }}>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>

                <div style={{ margin: "0.15em 0 0 0" }}>@{msg.username}</div>

                { isMyMessage &&

                  <button 
                    type="button" 
                    onClick={handleMessageDelete} 
                    data-message-id={msg.message_uuid} 
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      opacity: 0.7,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                    </svg>
                  </button>

                }

              </div>
              <div style={{ margin: "0.15em 0 0 0", height: "min-content" }}>{msg.message}</div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>{msg.message_datetime}</div>
            </section>
            )

          })
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
