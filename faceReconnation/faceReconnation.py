import base64
import io
import json
import os
import sys
import face_recognition
import flask
import numpy as np
from PIL import Image
from ariadne import graphql_sync
from ariadne.constants import PLAYGROUND_HTML
from ariadne.contrib.federation import FederatedObjectType
from ariadne_extensions.federation import FederatedManager
from flask import Flask, request, current_app
from flask_cors import CORS

know = []
knowImage = []


def recognizing(body, id):
    base64_img_bytes = body.encode('utf-8')
    with open("temp.jpeg", "wb") as f:
        f.write(base64.decodebytes(base64_img_bytes))
    small_frame = Image.open("temp.jpeg")
    small_frame.convert("RGB")
    small_frame.thumbnail((300, 300), Image.BICUBIC)
    small_frame.save("temp.jpeg")
    img = face_recognition.load_image_file("temp.jpeg", "RGB")

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
            "id": id,
            "names": [x for x in face_names if len(face_names)],
            "landmarks": {
                x: face_landmarks_list[face_names.index(x)]
                if face_names.index(x) < len(face_landmarks_list) else None
                for x in face_names
            }
        }
    return response


app = Flask(__name__)
CORS(app, support_credentials=True)
query = FederatedObjectType("Query")


@app.after_request
def after_request(response):
    response.access_control_allow_origin = "*"
    response.content_type = 'application/json'
    response.access_control_allow_headers = "*"
    # response.authorization = request.headers.get("authorization")
    return response


@query.field("face")
def resolve_face(_, __, image=None, id=None):
    return recognizing(image, id)


@query.field("addRecognizablePerson")
def resolve_addRecognizablePerson(_, __, image=None, name=None):
    file_name = name + "." + image.filename.split(".")[-1]
    image.save(os.path.join('./know/', file_name))
    know.append(name)
    knowImage.append(face_recognition.face_encodings(face_recognition.load_image_file("./know/" + file_name))[0])
    return "person add to program"


manager = FederatedManager(
    schema_sdl_file='./schema.graphql',
    query=query
)


@app.route("/graphql", methods=["GET"])
def graphql_playground():
    return PLAYGROUND_HTML, 200


@app.route("/graphql", methods=["POST", "OPTION"])
def graphql_server():
    if request.content_type.startswith("multipart/form-data"):
        data = request.get_data()[:417]
        split = str.split(data.decode("utf-8"), "\r\n")

        image = request.get_data()[550:]
        if image[0] == 103:
            image = request.get_data()[547:]
        if image[0] == 101:
            image = request.get_data()[553:]
        image = image[:-63]

        # data = combine_multipart_data(
        #     # # json.loads(request.form.get("operations")),
        #     # {"operations": json.loads(split[3])},
        #     # # json.loads(request.form.get("map")),
        #     # {"map": json.loads(split[7])},
        #     # # dict(request.files)
        #     # {"1": image}
        #     json.loads()
        # )
        success, result = graphql_sync(
            manager.get_schema(),
            json.loads(request.get_data()),
            context_value=request,
            debug=current_app.debug
        )
    else:
        data = request.get_json()
        success, result = graphql_sync(
            manager.get_schema(),
            data,
            context_value=request,
            debug=current_app.debug
        )
    status_code = 200 if success else 400
    # resp = flask.make_response(str(result))
    resp = flask.make_response(json.dumps(result))
    resp.headers['Content-Type'] = 'application/json'
    resp.headers['Access-Control-Allow-Origin'] = "*"
    # resp.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'authorization'
    resp.headers['Authorization'] = request.headers.get("authorization")
    #
    return resp, status_code


def main():
    # connection = pika.BlockingConnection(pika.ConnectionParameters(host='192.168.1.200'))
    # channel = connection.channel()
    # channel.queue_declare("faceReq", False, False, False, False, None)
    for (dirpath, dirnames, filenames) in os.walk("know"):
        know.extend(filenames)
        for filename in filenames:
            knowImage.append(face_recognition.face_encodings(face_recognition.load_image_file("./know/" + filename))[0])
        break

    # def callback(ch, method, properties, body):
    #     result = channel.queue_declare(queue='', exclusive=True)
    #     callback_queue = result.method.queue
    #
    #     channel.basic_publish(exchange='', routing_key='faceRep',
    #                           body=json.dumps(recognizing(io.BytesIO(body), 0), indent=4).encode("utf-8"),
    #                           properties=pika.BasicProperties(reply_to=callback_queue, ))
    #
    # channel.basic_consume(queue='faceReq', on_message_callback=callback, auto_ack=True)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    # graphqlSetup()
    app.run(host="0.0.0.0", port=5000, debug=False)
    # channel.start_consuming()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
