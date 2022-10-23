import io
import json

import pika, sys, os
import face_recognition
import numpy as np
from PIL import Image


def main():

    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()

    know = []
    knowImage = []
    for (dirpath, dirnames, filenames) in os.walk("know"):
        know.extend(filenames)
        for filename in filenames:
            knowImage.append(face_recognition.face_encodings(face_recognition.load_image_file("./know/" + filename))[0])
        break

    result = channel.queue_declare(queue='', exclusive=True)
    callback_queue = result.method.queue

    def callback(ch, method, properties, body):
        small_frame = Image.open(io.BytesIO(body))
        small_frame.convert("RGB")
        small_frame.thumbnail((300, 300), Image.ANTIALIAS)
        small_frame.save("temp.png")
        img = face_recognition.load_image_file("temp.png", "RGB")

        face_landmarks_list = face_recognition.face_landmarks(img)

        face_locations = face_recognition.face_locations(img)
        face_encodings = face_recognition.face_encodings(img, face_locations)
        face_names = []
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(knowImage, face_encoding)
            name = "Unknown"
            face_distances = face_recognition.face_distance(knowImage, face_encoding)
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                name = know[best_match_index]

            face_names.append(name)

        if len(face_names) == 0:
            face_names.append("personne inconnue")

        response = {
            "names": [x for x in face_names],
            "landmarks": {x: face_landmarks_list[face_names.index(x)] for x in face_names}
        }

        print()

        channel.basic_publish(exchange='', routing_key='faceRep', body=json.dumps(response, indent=4).encode("utf-8"),
                                  properties=pika.BasicProperties(reply_to=callback_queue, ))

    channel.basic_consume(queue='faceReq', on_message_callback=callback, auto_ack=True)

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