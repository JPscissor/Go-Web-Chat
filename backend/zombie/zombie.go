package zombie

import (
	"encoding/json"
	"fmt"
	"os"
)

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func isIPInFile(filename, targetIP string) (bool, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return false, fmt.Errorf("error reading file: %w", err)
	}

	var ips []string
	if err := json.Unmarshal(data, &ips); err != nil {
		return false, fmt.Errorf("parsing error: %w", err)
	}

	return contains(ips, targetIP), nil
}

func IsZombie(ip string) bool {

	found, err := isIPInFile("zombie/zombielist.json", ip)
	if err != nil {
		fmt.Printf("Ошибка: %v\n", err)
		return false
	}

	return found
}
