package handlers

import (
	"chat-room/backend/config"
	"chat-room/backend/models"
	"log"
	"net"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

func HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgradeConnection(w, r)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer ws.Close()

	client := models.Client{
		Nickname: getNickname(r),
		IP:       getClientIP(r),
	}

	registerClient(ws, client)
	defer unregisterClient(ws)

	if err := sendInitialData(ws, client.Nickname); err != nil {
		log.Printf("Initial data error: %v", err)
	}

	processMessages(ws, client.Nickname)
}

func upgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return config.Upgrader.Upgrade(w, r, nil)
}

func getClientIP(r *http.Request) string {
	// Проверяем заголовки, которые могут быть установлены прокси (например, nginx, Cloudflare)
	headers := []string{
		"X-Forwarded-For",
		"X-Real-Ip",
	}

	for _, header := range headers {
		if ip := r.Header.Get(header); ip != "" {
			// X-Forwarded-For может содержать список IP через запятую
			if ips := strings.Split(ip, ","); len(ips) > 0 {
				return strings.TrimSpace(ips[0])
			}
		}
	}

	// Если прокси нет — берём напрямую из удалённого адреса
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return "unknown"
	}
	return ip
}
