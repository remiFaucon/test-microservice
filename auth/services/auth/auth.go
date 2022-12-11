package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	amqp "github.com/rabbitmq/amqp091-go"
	"log"
	"time"
)

type Message struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Main() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	var forever chan struct{}

	rabbitQueue("login", ch)
	rabbitQueue("register", ch)

	<-forever
}

type User struct {
	name     string
	email    string
	password string
}

var users = []User{
	{"remi", "faucon.remi04@gmail.coms", "1234"},
	{"remi", "zefs", "1234"},
}

func Register(name string, email string, password string) []User {
	var user = User{
		name,
		email,
		password,
	}

	users = append(users, user)

	return users
}
func login(identifier string, password string) (*User, error) {
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

func rabbitQueue(queueName string, ch *amqp.Channel) {
	//a, _ := ch.QueueBind()

	q, err := ch.QueueDeclare(queueName, false, false, false, false, nil)
	failOnError(err, "Failed to declare a queue")

	err = ch.Qos(1, 0, false)
	failOnError(err, "Failed to set QoS")

	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	failOnError(err, "Failed to register a consumer")

	//err := ch.ExchangeDeclare(
	//	"registerRep", // name
	//	"fanout",      // type
	//	true,          // durable
	//	false,         // auto-deleted
	//	false,         // internal
	//	false,         // no-wait
	//	nil,           // arguments
	//)
	//failOnError(err, "Failed to declare an exchange")
	//
	//q, err := ch.QueueDeclare(
	//	"register", // name
	//	false,      // durable
	//	false,      // delete when unused
	//	true,       // exclusive
	//	false,      // no-wait
	//	nil,        // arguments
	//)
	//failOnError(err, "Failed to declare a queue")
	//
	//err = ch.QueueBind(
	//	q.Name,        // queue name
	//	"registerRep", // routing key
	//	"",            // exchange
	//	false,
	//	nil,
	//)
	//failOnError(err, "Failed to bind a queue")
	//
	//msgs, err := ch.Consume(
	//	q.Name, // queue
	//	"",     // consumer
	//	true,   // auto-ack
	//	false,  // exclusive
	//	false,  // no-local
	//	false,  // no-wait
	//	nil,    // args
	//)
	//failOnError(err, "Failed to register a consumer")

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		for d := range msgs {

			response, err := getResponse(queueName, d)
			failOnError(err, "this queue has not function get rep")

			fmt.Println(response)

			err = ch.PublishWithContext(ctx,
				"",              // exchange
				queueName+"Rep", // routing key
				false,           // mandatory
				false,           // immediate
				amqp.Publishing{
					ContentType:   "application/json",
					CorrelationId: d.CorrelationId,
					Body:          response,
				})
			failOnError(err, "Failed to publish a message")

			err = d.Ack(false)
			if err != nil {
				return
			}
		}
	}()
}

func getResponse(name string, d amqp.Delivery) ([]byte, error) {
	switch name {
	case "login":
		var m Message
		_ = json.Unmarshal(d.Body, &m)

		user, err := login(m.Name, m.Password)
		var userObj Message
		if err == nil {
			userObj.Name = user.name
			userObj.Email = user.email
		}

		j, err := json.Marshal(userObj)
		failOnError(err, "Failed to json convert")

		return j, nil

	case "register":
		var m Message
		_ = json.Unmarshal(d.Body, &m)

		fmt.Println(m)

		Register(m.Name, m.Email, m.Password)
		var res = map[string]string{"status": "registered"}
		j, err := json.Marshal(res)
		failOnError(err, "Failed to json convert")

		return j, nil
	}
	return nil, errors.New("no response for this queue")
}
