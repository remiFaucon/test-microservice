import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import http from 'http';
import {Server} from "socket.io";
import amqp from 'amqplib/callback_api';
import ps from 'ps-node';
import exec from "child_process";
import fileUpload from "express-fileupload";
import {PythonShell} from "python-shell";

const app = express()
const server = http.createServer(app);
const io = new Server(server);
const port = 3000

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(fileUpload({createParentPath: true}));
app.set('view engine', 'ejs');
app.use('/assets', express.static('./assets'))

app.get('/', (req, res) => {
    res.render("index.ejs", {content: "temp"});
})

function launch(command: string) {
    let a = exec.spawn("bash", ["../faceReconnation/launch.bash"])
    a.on("close", (err: number, stdout: string|null, stderr: any) => {console.log(err, stdout, stderr)})
}

function programmeRun(commandObject: ps.Query, command: string) {
    ps.lookup(commandObject, (err, resultList) => {
        if (err)
            throw new Error(err.toString());
        if (resultList.length === 0) {
            console.log("No result")
            if (command !== "")
                launch(command)
        }
        else {
            console.log(resultList)
        }
    })
}
// function face(conn, timeout) {
//     return new Promise((resolve, reject) => {
//         conn.createChannel((err2, channel) => {
//             channel.assertQueue("faceRep", {durable: false});
//             channel.consume("faceRep", msg => {
//                 console.log("resolve")
//                 resolve(JSON.parse(msg.content.toString()))
//             }, {noAck: true})
//         })
//          setTimeout(() => {
//              programmeRun({command: 'python3.8', arguments: '.faceReconnation.py'})
//         }, timeout)
//     })
//
// }

amqp.connect( 'amqp://localhost', (err, conn) => {
    if (err)
        throw err

    app.post('/', (req, res) => {
        conn.createChannel((err1, channel) => {
            if (err1)
                throw err1
            channel.assertQueue("numberReq", {durable: false});

            if (!req.files) {
                res.send({
                    status: false,
                    message: 'No file uploaded'
                });
            } else {
                let data = [];
                // @ts-ignore
                for (let element of Object.values(req.files)) {
                    // @ts-ignore
                    if (element.mimetype === 'image/png') {
                        // @ts-ignore
                        channel.sendToQueue("numberReq", Buffer.from(element.data))
                        // @ts-ignore
                        element.mv(__dirname + '/upload/' + element.name)
                        // @ts-ignore
                        data.push({name: element.name, mimetype: element.mimetype, size: element.size})
                    }
                }
                res.send({
                    status: true,
                    message: 'Files are uploaded',
                    data: data
                });
            }
        })
    })




    app.post("/face", (req, res) => {
        conn.createChannel((err1, channel) => {
            if (err1)
                throw err1
            channel.assertQueue("faceReq", {durable: false})
            const timeout = setTimeout(() => res.status(500).send({error: new Error("response Timeout")}), 3000)
            // @ts-ignore
            channel.sendToQueue("faceReq", req.files["file"].data)
            conn.createChannel((err2, channel) => {
                channel.assertQueue("faceRep", {durable: false});
                channel.consume("faceRep", msg => {
                    clearTimeout(timeout);
                    res.status(200).send(JSON.parse(msg!.content.toString()))
                    channel.close(err => err ? console.log(err) : null);
                }, {noAck: true})
            })
        })
    })

io.on('connection', (socket) => {
    conn.createChannel((err1, channel) => {
        channel.assertQueue("numberRep", {durable: false});
        channel.consume("numberRep", msg => {
            socket.emit('predict', " "+msg!.content.toJSON().data[0]+" ")
        }, {noAck: true})
        })
    })

    // conn.createChannel((err1, channel) => {
    //         channel.assertQueue("faceRep", {durable: false});
    //         channel.consume("faceRep", msg => {
    //             console.log("face")
    //         }, {noAck: true})
    //     })
})

server.listen(port, () => {
    // exec("python3.8 ../faceReconnation/faceReconnation.py", result => console.log(result));
    // programmeRun(
    //             {command: 'python3.8', arguments: '../faceReconnation/faceReconnation.py'},
    //             "bash ../faceReconnation/launch.bash"
    //             )
    // setInterval(function () {
    //     programmeRun(
    //         {command: 'python3.8', arguments: '../faceReconnation/faceReconnation.py'},
    //         ""
    //     )
    // }, 500)

    PythonShell.run('../faceReconnation/faceReconnation.py', undefined, (err, results) => console.log(err, results))

    console.log(`Example app listening on port ${port}`)
})