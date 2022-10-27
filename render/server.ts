import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import http from 'http';
import {Server} from "socket.io";
import amqp from 'amqplib/callback_api';
import ps from 'ps-node';
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

function programmeRun(commandObject: ps.Query) {
    ps.lookup(commandObject, (err, resultList) => {
        if (err)
            throw new Error(err.toString());
        if (resultList.length === 0)
            if (typeof commandObject.arguments === "string")
                PythonShell.run(commandObject.arguments, undefined, (err, results) => console.log(err, results))
    })
}

amqp.connect( 'amqp://localhost', (err, conn) => {
    if (err)
        throw err

    app.post('/', (req, res) => {
        conn.createChannel((err1, channel) => {
            if (err1)
                throw err1
            channel.assertQueue("numberReq", {durable: false});

            if (!req.files)
                res.send({error: "no files specified"});
            else {
                if ("data" in req.files[0])
                    channel.sendToQueue("numberReq", Buffer.from(req.files[0].data))
                    conn.createChannel((err1, channel) => {
                        channel.assertQueue("numberRep", {durable: false});
                        channel.consume("numberRep", msg => {
                            console.log(msg!.content.toString())
                            res.status(200).send(JSON.parse(msg!.content.toString()));
                            channel.close(err => err ? console.log(err) : null);
                        }, {noAck: true})
                })
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
})

server.listen(port, () => {
    programmeRun({command: 'python3', arguments: '../faceReconnation/faceReconnation.py'})
    programmeRun({command: 'python3', arguments: '../MLNumber/index.py'})
    console.log(`Example app listening on port ${port}`)
})