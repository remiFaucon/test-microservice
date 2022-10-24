const express = require('express')
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const { Server } = require("socket.io");
const amqp = require('amqplib/callback_api');

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

amqp.connect( 'amqp://localhost', (err, conn) => {
    if (err)
        throw err

    conn.createChannel((err1, channel) => {
        if (err1)
            throw err1
        channel.assertQueue("numberReq", {durable: false});

        app.post('/', (req, res) => {
            if(!req.files) {
                res.send({
                    status: false,
                    message: 'No file uploaded'
                });
            }
            else {
                let data = [];
                if (typeof req.files['file[]'].data === "undefined"){
                    req.files['file[]'].forEach(element => {
                        if (element.mimetype === 'image/png') {
                            channel.sendToQueue("numberReq", Buffer.from(element.data))
                            element.mv(__dirname + '/upload/' + element.name)
                            data.push({
                                name: element.name,
                                mimetype: element.mimetype,
                                size: element.size
                            })
                        }
                    })
                }
                else {
                    channel.sendToQueue("numberReq", Buffer.from(req.files['file[]'].data))
                    req.files['file[]'].mv(__dirname + '/upload/' + req.files['file[]'].name)
                    data.push({
                        name: req.files['file[]'].name,
                        mimetype: req.files['file[]'].mimetype,
                        size: req.files['file[]'].size
                    })
                }
                res.send({
                    status: true,
                    message: 'Files are uploaded',
                    data: data
                });
            }
        })
    })


    conn.createChannel((err1, channel) => {
        if (err1)
            throw err1
        channel.assertQueue("faceReq", {durable: false});
        app.post("/face", (req, res) => {
            channel.sendToQueue("faceReq", req.files["file"].data)
            new Promise((resolve) => {
                conn.createChannel((err2, channel) => {
                    channel.assertQueue("faceRep", {durable: false});
                    channel.consume("faceRep", msg => {
                        resolve(JSON.parse(msg.content.toString()))
                    }, {noAck: true})
                })
            }).then(data => res.status(200).send(data))
         })
    })

io.on('connection', (socket) => {
    conn.createChannel((err1, channel) => {
        channel.assertQueue("numberRep", {durable: false});
        channel.consume("numberRep", msg => {
            socket.emit('predict', " "+msg.content.toJSON().data[0]+" ")
        }, {noAck: true})
        })
    })
})


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})