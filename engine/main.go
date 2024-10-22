package main

import "fmt"

func main() {
	m := map[string]int{
		"Raman": 1,
		"kirat": 2,
		"sumit": 1,
	}

	k, val := m["h"]
	if val {
		fmt.Println("true", val)
	} else {
		fmt.Println("key not found", k)
	}

}
