import io
import json
import pika, sys, os
import face_recognition
import numpy as np
from PIL import Image
from ariadne.constants import PLAYGROUND_HTML
from ariadne_extensions.federation import FederatedManager
from flask import Flask, request, jsonify, current_app
from ariadne import graphql_sync, combine_multipart_data
from ariadne.contrib.federation import FederatedObjectType

know = []
knowImage = []


def recognizing(body):
    print("in function", body)
    small_frame = Image.open(body)
    small_frame.convert("RGB")
    small_frame.thumbnail((300, 300), Image.BICUBIC)
    small_frame.save("temp.png")
    img = face_recognition.load_image_file("temp.png", "RGB")

    face_landmarks_list = face_recognition.face_landmarks(img)

    face_locations = face_recognition.face_locations(img)
    face_encodings = face_recognition.face_encodings(img, face_locations)
    face_names = []
    i = 0
    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces(knowImage, face_encoding)
        name = "person" + str(i)
        face_distances = face_recognition.face_distance(knowImage, face_encoding)
        if len(face_distances) != 0:
            print(face_distances)
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                name = know[best_match_index]
            else:
                i = i + 1
        face_names.append(name)

    if len(face_names) == 0:
        response = {}
    else:
        response = {
            "names": [x for x in face_names],
            "landmarks": {
                x: face_landmarks_list[face_names.index(x)]
                if face_names.index(x) < len(face_landmarks_list) else None
                for x in face_names
            }
        }
    return response


app = Flask(__name__)
query = FederatedObjectType("Query")


@query.field("face")
def resolve_face(_, __, image=None):
    return recognizing(image)


@query.field("addRecognizablePerson")
def resolve_addRecognizablePerson(_, __, image=None, name=None):
    file_name = name + "." + image.filename.split(".")[-1]
    image.save(os.path.join('./know/', file_name))
    know.append(name)
    knowImage.append(face_recognition.face_encodings(face_recognition.load_image_file("./know/" + file_name))[0])
    return "person add to program"

manager = FederatedManager(
    schema_sdl_file='schema.graphql',
    query=query
)


@app.route("/graphql", methods=["GET"])
def graphql_playground():
    return PLAYGROUND_HTML, 200


@app.route("/graphql", methods=["POST"])
def graphql_server():
    if request.content_type.startswith("multipart/form-data"):
        print("req", request.form.get("operations"))
        data = combine_multipart_data(
            json.loads(request.form.get("operations")),
            json.loads(request.form.get("map")),
            dict(request.files)
        )
        print("after post multipart", data)
        success, result = graphql_sync(
            manager.get_schema(),
            data,
            context_value=request,
            debug=current_app.debug
        )
    else:
        data = request.get_json()
        print("json", data)
        success, result = graphql_sync(
            manager.get_schema(),
            data,
            context_value=request,
            debug=current_app.debug
        )
    status_code = 200 if success else 400
    return jsonify(result), status_code


def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()
    channel.queue_declare("faceReq", False, False, False, False, None)
    for (dirpath, dirnames, filenames) in os.walk("know"):
        know.extend(filenames)
        for filename in filenames:
            knowImage.append(face_recognition.face_encodings(face_recognition.load_image_file("./know/" + filename))[0])
        break

    def callback(ch, method, properties, body):
        result = channel.queue_declare(queue='', exclusive=True)
        callback_queue = result.method.queue

        channel.basic_publish(exchange='', routing_key='faceRep',
                              body=json.dumps(recognizing(io.BytesIO(body)), indent=4).encode("utf-8"),
                              properties=pika.BasicProperties(reply_to=callback_queue, ))

    channel.basic_consume(queue='faceReq', on_message_callback=callback, auto_ack=True)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    # graphqlSetup()
    app.run(debug=True)
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
