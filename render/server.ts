import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import http from 'http';
import amqp from 'amqplib/callback_api';
import ps from 'ps-node';
import fileUpload from "express-fileupload";
import {PythonShell} from "python-shell";
import { buildFederatedSchema } from "@apollo/federation";
import {login, resolvers} from "./graphql/resolver";
import { ApolloServer } from 'apollo-server-express';
import { gql } from 'graphql-tag';
import * as fs from "fs";
const app = express()
const server = http.createServer(app);
const port = 3001

const typeDefs = gql`${fs.readFileSync("./graphql/schema.graphql")}`

const serverApollo = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
});

serverApollo.start().then(() => serverApollo.applyMiddleware({ app }));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(fileUpload({createParentPath: true}));
app.set('view engine', 'ejs');
app.use('/assets', express.static('./assets'))
app.use('/assetsjs', express.static('./dist/assets'))

app.get('/', (req, res) => {
    if (login.filter(e => e.uuid === req.query.uuid).length > 0){
        res.render("index.ejs");
    }
    else {
        res.redirect("/login")
    }
})
app.get('/login', (req, res) => {
    res.render("login.ejs");
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
                if ("data" in req.files[0]){
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
            }
        })
    })

    app.post("/face", (req, res) => {
        // console.log(req.files)
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
                    if (res.statusCode !== 500)
                        res.status(200).send(JSON.parse(msg!.content.toString()))
                    channel.close(err => err ? console.log(err) : null);
                }, {noAck: true})
            })
        })
    })

    app.post("/login", (req, res) => {
        conn.createChannel((err1, channel) => {
            if (err1)
                throw err1
            channel.assertQueue("login", {durable: false})
            const timeout = setTimeout(() => res.status(201).render("login.ejs"), 3000)
            channel.sendToQueue("login", Buffer.from(JSON.stringify(req.body)))
            conn.createChannel((err2, channel) => {
                channel.assertQueue("loginRep", {durable: false});
                channel.consume("loginRep", msg => {
                    clearTimeout(timeout);
                    console.log(msg!.content.toString())
                    if (JSON.parse(msg!.content.toString()).name !== "")
                        if (res.statusCode !== 201)
                            res.redirect("/?uuid="+ resolvers.Mutation.login({user: {name: req.body.name, email: req.body.name, password: req.body.password}}, 1).uuid)
                    else
                        if (res.statusCode !== 201)
                            res.render("login.ejs")
                    channel.close(err => err ? console.log(err) : null);
                }, {noAck: true})
            })
        })
    })

    app.post("/register", (req, res) => {
        conn.createChannel((err1, channel) => {
            if (err1)
                throw err1
            channel.assertQueue("register", {durable: false})
            const timeout = setTimeout(() => res.status(201).render("login.ejs"), 3000)
            channel.sendToQueue("register", Buffer.from(JSON.stringify(req.body)))
            conn.createChannel((err2, channel) => {
                channel.assertQueue("registerRep", {durable: false});
                channel.consume("registerRep", msg => {
                    clearTimeout(timeout);
                    if (JSON.parse(msg!.content.toString()).status === "registered")
                        if (res.statusCode !== 201)
                            res.redirect('/?uuid=' + resolvers.Mutation.login({user: {name: req.body.name, email: req.body.name, password: req.body.password}}, 1).uuid)
                    else
                        if (res.statusCode !== 201)
                            res.render("login.ejs")
                    channel.close(err => err ? console.log(err) : null);
                }, {noAck: true})
            })
        })
    })
})

server.listen(port, async () => {

    // setTimeout(() => {
    //     fetch("http://localhost:3000/", {method: "post"})
    //     fs.readFile('./upload/5.png', async (err, fd) => {
    //         let form_data = new FormData()
    //         form_data.append('file', new Blob([fd]))
    //         await fetch("http://localhost:3000/face", {
    //             method: "post",
    //             body: form_data
    //         })
    //         programmeRun({command: 'python3', arguments: '../faceReconnation/faceReconnation.py'})
    //         programmeRun({command: 'python3', arguments: '../MLNumber/index.py'})
    //     })
    //
    //     spawn("go", ["../auth/auth.go"], {detached: true, stdio: [ 'ignore' ]}).on("close", async (message, sendHandle) => {
    //         console.log(message, sendHandle)
    //         // @ts-ignore
    //         await fetch("http://localhost:3000/register", {method: 'POST', body: {name: "setupServer", password: 123456789, email: "setup@server.com"}})
    //         // @ts-ignore
    //         fetch("http://localhost:3000/login", {method: 'POST', body: {name: "setupServer", password: 123456789}})
    //     })
    // }, 1000)

    console.log(`Example app listening on port ${port}`)
})