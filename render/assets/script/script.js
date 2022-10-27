// let socket = io("http://localhost:3000");
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d")
ctx.fillStyle = "#FF0000";
canvas.width = 1000
canvas.height = 700

// socket.on("predict", (number) => {
//     const p = document.createElement("p");
//     document.querySelector("main").appendChild(p)
//     p.innerHTML = number
// })

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then((video) => {
    const track = video.getVideoTracks()[0]
    post(track)
})
p = document.createElement('h2')
document.body.appendChild(p)
function post (track) {
    let imageCapture = new ImageCapture(track)
    imageCapture.takePhoto().then((image) => {
        let form_data = new FormData()
        form_data.append('file', image)
        fetch("/face", {method: "POST", body: form_data}).then(data => {
            post(track)
            data.json().then(json => {
                console.log(json);
                if (json.landmarks["personne inconnue"] !== null) {
                    ctx.reset()
                    let f = ""
                    json.names.forEach(name => {
                         f = f + ' ' + name.split('.')[0]
                        console.log(json.landmarks[name])
                        Object.values(json.landmarks[name]).forEach(values => {
                            values.forEach(XY => {
                                ctx.fillRect(XY[0], XY[1], 2, 2);
                            })
                        })
                    })
                    p.innerHTML = f
                }
            })
        })
    })
}