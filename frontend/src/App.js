import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const anyFileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connect = () => {
    if (!nickname.trim()) {
      alert('Enter nickname');
      return;
    }

    const socketUrl = `ws://${window.location.host}/ws?nickname=${encodeURIComponent(nickname)}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev, {
          nickname: data.nickname,
          text: data.text,
          time: data.time,
          imageUrl: data.imageUrl,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType
        }]);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      setSelectedImage(file);
      setSelectedFile(null);
      setSelectedFileInfo(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnyFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      setSelectedFile(file);
      setSelectedFileInfo({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAnyFile = () => {
    setSelectedFile(null);
    setSelectedFileInfo(null);
    if (anyFileInputRef.current) {
      anyFileInputRef.current.value = '';
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;
    const formData = new FormData();
    formData.append('image', selectedImage);
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения');
      }
      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка загрузки изображения');
      return null;
    }
  };

  const uploadAnyFile = async () => {
    if (!selectedFile) return null;
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('/upload-file', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Ошибка загрузки файла');
      }
      const result = await response.json();
      return result; // { fileUrl, fileName, fileSize, mimeType }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла');
      return null;
    }
  };

  const sendMessage = async () => {
    if ((!message.trim() && !selectedImage && !selectedFile) || !ws.current) return;

    let messageType = 'text';
    let payload = { text: message };

    if (selectedImage) {
      const imageUrl = await uploadImage();
      if (!imageUrl) return;
      messageType = 'image';
      payload = { text: message || 'Изображение', type: messageType, imageUrl };
    } else if (selectedFile) {
      const res = await uploadAnyFile();
      if (!res) return;
      messageType = 'file';
      payload = {
        text: message || res.fileName,
        type: messageType,
        fileUrl: res.fileUrl,
        fileName: res.fileName,
        fileSize: res.fileSize,
        mimeType: res.mimeType
      };
    } else {
      payload = { text: message, type: 'text' };
    }

    ws.current.send(JSON.stringify(payload));
    setMessage('');
    removeImage();
    removeAnyFile();
  };

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  };

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const humanSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  return (
    <div className="app-container">
      <h1>Chat-Room</h1>
      {!isConnected ? (
        <div className="login-box">
          <h2>Enter chat</h2>
          <input
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && connect()}
          />
          <button onClick={connect}>connect</button>
        </div>
      ) : (
        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`message-wrapper ${
                  msg.nickname === "Система" ? 'system' :
                  msg.nickname === nickname ? 'own' : 'other'
                }`}
              >
                <div className="message">
                  {msg.nickname !== "Система" && (
                    <div className="message-header">
                      <span className="nickname">{msg.nickname}</span>
                      <span className="time">{formatTime(msg.time)}</span>
                    </div>
                  )}
                  <div className="message-text">
                    {msg.text}
                    {msg.type === 'image' && msg.imageUrl && (
                      <div className="message-image">
                        <img 
                          src={msg.imageUrl} 
                          alt="Uploaded content" 
                          style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px', marginTop: '8px' }}
                        />
                      </div>
                    )}
                    {msg.type === 'file' && msg.fileUrl && (
                      <div className="message-file" style={{ marginTop: '8px' }}>
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" download>
                          {msg.fileName || 'Файл'}{msg.fileSize ? ` (${humanSize(msg.fileSize)})` : ''}
                        </a>
                      </div>
                    )}
                  </div>
                  {msg.nickname === "Система" && (
                    <div className="message-time">{formatTime(msg.time)}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-area">
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} />
                <button onClick={removeImage} style={{ marginLeft: '8px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            )}
            {selectedFileInfo && (
              <div className="image-preview">
                <span>{selectedFileInfo.name} ({humanSize(selectedFileInfo.size)})</span>
                <button onClick={removeAnyFile} style={{ marginLeft: '8px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            )}
            <div className="input-row">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button 
                className="icon-button camera"
                onClick={() => fileInputRef.current?.click()}
              >
                📷
              </button>

              <input
                type="file"
                ref={anyFileInputRef}
                onChange={handleAnyFileSelect}
                style={{ display: 'none' }}
              />
              <button 
                className="icon-button attach"
                onClick={() => anyFileInputRef.current?.click()}
              >
                📎
              </button>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Напишите сообщение..."
                className="message-input"
              />
              <button className="send-button" onClick={sendMessage}>Отправить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;