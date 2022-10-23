import numpy as np
from sklearn import datasets
from sklearn.neural_network import MLPClassifier
import pika, sys, os
import io
from PIL import Image


def main():
    digits = datasets.load_digits()
    y = digits.target
    x = digits.images.reshape((len(digits.images), -1))

    mlp = MLPClassifier(hidden_layer_sizes=(15,), activation='logistic', alpha=1e-4,
                        solver='sgd', tol=1e-4, random_state=1,
                        learning_rate_init=.1, verbose=True)

    mlp.fit(x, y)

    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()

    result = channel.queue_declare(queue='', exclusive=True)
    callback_queue = result.method.queue

    def callback(ch, method, properties, body):
        image = Image.open(io.BytesIO(body)).convert('L')
        size = 8, 8
        image.thumbnail(size, Image.ANTIALIAS)
        pixels = []
        for i in range(image.width):
            for j in range(image.height):
                pixels.append(round((image.getpixel((i, j)) + 1) / 16))
        predicted = mlp.predict(np.array([pixels]))
        print(np.frombuffer(predicted.tobytes(), dtype=int))
        channel.basic_publish(exchange='', routing_key='numberRep', body=predicted.tobytes(),
                              properties=pika.BasicProperties(reply_to=callback_queue, ))

    channel.basic_consume(queue='numberReq', on_message_callback=callback, auto_ack=True)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
