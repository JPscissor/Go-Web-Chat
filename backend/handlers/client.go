package handlers

import (
	"chat-room/backend/config"
	"chat-room/backend/models"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

func getNickname(r *http.Request) string {

	rand.New(rand.NewSource(time.Now().UnixNano()))
	digits := make([]byte, 3)
	for i := range digits {
		digits[i] = byte(rand.Intn(10)) + '0'
	}

	if nickname := r.URL.Query().Get("nickname"); nickname != "" {

		if !isNickTaken(nickname) {
			return nickname
		} else {
			return nickname + string(digits)
		}
	}

	return getRandNickname()
}

func getRandNickname() string {
	rand.New(rand.NewSource(time.Now().UnixNano()))
	digits := make([]byte, 3)
	for i := range digits {
		digits[i] = byte(rand.Intn(10)) + '0'
	}
	randNick := "Новый пользователь чата " + string(digits)

	return randNick
}

func isNickTaken(value string) bool {
	for _, v := range config.Clients {
		if v == value {
			return true
		}
	}
	return false
}

func isNickAdmin(value string) bool {
	return value == "Система"
}

func registerClient(ws *websocket.Conn, client models.Client) {
	config.ClientsMu.Lock()
	config.Clients[ws] = client
	config.ClientsMu.Unlock()
	log.Printf("%s connected!", client.Nickname)
}

func unregisterClient(ws *websocket.Conn) {
	config.ClientsMu.Lock()
	client := config.Clients[ws]
	delete(config.Clients, ws)
	config.ClientsMu.Unlock()
	log.Printf("%s disconnected!", client.Nickname)
}
