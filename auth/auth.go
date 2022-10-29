package main

import (
	"context"
	_ "debug/pe"
	"encoding/json"
	"errors"
	"fmt"
	_ "fmt"
	_ "github.com/rabbitmq/amqp091-go"
	amqp "github.com/rabbitmq/amqp091-go"
	"log"
	_ "log"
	"strconv"
	_ "strconv"
	"strings"
	"time"
)

type Message struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func main() {
	//fmt.Println("register: ")
	//fmt.Println(register("john", "example@gmail.com", 123654))
	//fmt.Println("login: ")
	//user, _ := login("john", 123654)
	//fmt.Println(user)
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"",    // name
		false, // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	failOnError(err, "Failed to declare a queue")

	err = ch.Qos(
		1,     // prefetch count
		0,     // prefetch size
		false, // global
	)
	failOnError(err, "Failed to set QoS")

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	var forever chan struct{}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		for d := range msgs {
			var m Message
			_ = json.Unmarshal(d.Body, &m)
			password, err := strconv.Atoi(strings.Replace(m.Password, "\r", "", -1))
			failOnError(err, "Failed to convert")

			user, err := login(m.Name, password)
			failOnError(err, "Failed to login")

			fmt.Println(user)

			j, err := json.Marshal(user)
			failOnError(err, "Failed to json convert")

			fmt.Println(j)

			err = ch.PublishWithContext(ctx,
				"",        // exchange
				d.ReplyTo, // routing key
				false,     // mandatory
				false,     // immediate
				amqp.Publishing{
					ContentType:   "application/json",
					CorrelationId: d.CorrelationId,
					Body:          j,
				})
			failOnError(err, "Failed to publish a message")

			err = d.Ack(false)
			if err != nil {
				return
			}
		}
	}()

	log.Printf(" [*] Awaiting RPC requests")
	<-forever
}

type User struct {
	name     string
	email    string
	password int
}

var users = []User{
	{"582", "zefs", 1234},
	{"remi", "zefs", 1234},
}

func register(name string, email string, password int) []User {
	var user = User{
		name,
		email,
		password,
	}

	users = append(users, user)

	return users
}
func login(identifier string, password int) (*User, error) {
	for _, user := range users {
		if (user.email == identifier || user.name == identifier) && user.password == password {
			return &user, nil
		}
	}
	return nil, errors.New("user not found")
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}
