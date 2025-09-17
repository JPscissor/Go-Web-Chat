package models

type Client struct {
	Nickname string
	IP       string
	IsZombie bool
}

type Message struct {
	Nickname string `json:"nickname"`
	Text     string `json:"text"`
	Time     string `json:"time"`

	ImageURL string `json:"imageUrl,omitempty"`

	FileURL  string `json:"fileUrl,omitempty"`
	FileName string `json:"fileName,omitempty"`
	FileSize int64  `json:"fileSize,omitempty"`
	MimeType string `json:"mimeType,omitempty"`

	Type string `json:"type"`
}

type ClientMessage struct {
	Text string `json:"text"`

	ImageURL string `json:"imageUrl,omitempty"`

	FileURL  string `json:"fileUrl,omitempty"`
	FileName string `json:"fileName,omitempty"`
	FileSize int64  `json:"fileSize,omitempty"`
	MimeType string `json:"mimeType,omitempty"`

	Type string `json:"type"`
}
