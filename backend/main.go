package main

import (
	"chat-room/backend/config"
	"chat-room/backend/handlers"
	"chat-room/backend/storage"
	"log"
	"net/http"
	"os"
)

func main() {

	store, err := storage.New(os.Getenv("DB_URL"))
	if err != nil {
		log.Fatal("Failed to initialize storage: ", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			log.Printf("Error closing storage: %v", err)
		}
	}()

	storage.InitStorage(store)

	go handlers.MessagesHandler()

	http.HandleFunc("/ws", handlers.HandleConnections)
	http.HandleFunc("/upload", handlers.HandleImageUpload)
	http.HandleFunc("/upload-file", handlers.HandleFileUpload)
	http.HandleFunc("/uploads/", handlers.ServeUploadedFiles)
	// http.HandleFunc("/admin/")

	config.ServeFrontend()

	//port := config.GetPort()
	log.Printf("Server started")
	log.Fatal(http.ListenAndServe("0.0.0.0:6868", nil))
}