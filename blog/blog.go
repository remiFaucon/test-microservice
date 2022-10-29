package main

import (
	"bufio"
	"context"
	_ "context"
	"encoding/json"
	_ "encoding/json"
	"fmt"
	_ "go/types"
	"log"
	"math/rand"
	"os"
	"strings"
	"time"
	_ "time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Id struct {
	Name     string
	Password string
}

func main() {

	//conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	//failOnError(err, "Failed to connect to RabbitMQ")
	//defer conn.Close()
	//
	//ch, err := conn.Channel()
	//failOnError(err, "Failed to open a channel")
	//defer ch.Close()

	reader := bufio.NewReader(os.Stdin)
	fmt.Println("simple Shell")
	fmt.Println("---------------------")
	fmt.Println("user/password")

	for {
		fmt.Print("-> ")
		text, _ := reader.ReadString('\n')
		// convert CRLF to LF
		text = strings.Replace(text, "\n", "", -1)

		identifiants := strings.Split(text, "/")

		var id Id
		id.Name = identifiants[0]
		id.Password = identifiants[1]

		//q, err := ch.QueueDeclare(
		//	"connection", // name
		//	false,        // durable
		//	false,        // delete when unused
		//	false,        // exclusive
		//	false,        // no-wait
		//	nil,          // arguments
		//)
		//failOnError(err, "Failed to declare a queue")
		//
		//ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		//defer cancel()

		j, err := json.Marshal(id)
		failOnError(err, "convert json bug")
		//fmt.Println(j)

		res, err := fibonacciRPC(j)

		fmt.Println(res)
		//	err = ch.PublishWithContext(ctx,
		//		"",     // exchange
		//		q.Name, // routing key
		//		false,  // mandatory
		//		false,  // immediate
		//		amqp.Publishing{
		//			ContentType: "application/json",
		//			Body:        j,
		//		})
		//	failOnError(err, "Failed to publish a message")
		//
		//	msgs, err := ch.Consume(
		//		q.Name, // queue
		//		"",     // consumer
		//		true,   // auto-ack
		//		false,  // exclusive
		//		false,  // no-local
		//		false,  // no-wait
		//		nil,    // args
		//	)
		//	failOnError(err, "Failed to register a consumer")
		//
		//	var forever chan struct{}
		//
		//	go func() {
		//		for d := range msgs {
		//			log.Printf("Received a message: %s", d.Body)
		//		}
		//	}()
		//
		//	<-forever
	}

}

//}

//func connected(ch *amqp.Channel) {
//	q, err := ch.QueueDeclare(
//		"connection", // name
//		false,        // durable
//		false,        // delete when unused
//		false,        // exclusive
//		false,        // no-wait
//		nil,          // arguments
//	)
//	failOnError(err, "Failed to declare a queue")
//
//
//}

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

func fibonacciRPC(n []byte) (res []byte, err error) {
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
		true,  // exclusive
		false, // noWait
		nil,   // arguments
	)
	failOnError(err, "Failed to declare a queue")

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	//var corrIdInt *rand.Rand = rand.New(rand.NewSource(time.Now().UnixNano()))
	corrId := RandStringRunes(1)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = ch.PublishWithContext(ctx,
		"",           // exchange
		"connection", // routing key
		false,        // mandatory
		false,        // immediate
		amqp.Publishing{
			ContentType:   "application/json",
			CorrelationId: corrId,
			ReplyTo:       q.Name,
			Body:          n,
		})
	failOnError(err, "Failed to publish a message")

	for d := range msgs {
		if corrId == d.CorrelationId {
			_ = json.Unmarshal(d.Body, &res)
			//failOnError(err, "Failed to convert body to integer")
			break
		}
	}
	return
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func RandStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}
