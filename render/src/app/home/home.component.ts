import { Component, OnInit } from '@angular/core';
import {Apollo, gql} from "apollo-angular";
// @ts-ignore
import * as extract from "extract-files/extractFiles.mjs";
// @ts-ignore
import * as extractable from "extract-files/isExtractableFile.mjs";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private id: number = 0;

  constructor(private apollo: Apollo) { }

  ngOnInit(): void {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement
    let ctx = canvas!.getContext("2d");
    ctx!.fillStyle = "#FF0000";
    canvas!.width = 1000
    canvas!.height = 700
    const h2 = document.querySelector("h2")

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((video) => {
      const track = video.getVideoTracks()[0]
      face(track)
    })


    const face = (track: MediaStreamTrack) => {
        // @ts-ignore
      let imageCapture = new ImageCapture(track)
      imageCapture.takePhoto().then((image: any) => {
      this.apollo
        .watchQuery({
          query: gql`
            query ($file: Upload!, $id: ID!) {
              face(image: $file, id: $id) {
                id
                names
                landmarks
              }
            }
          `,
          variables: {
            id: this.id,
            file: image
          },
          context: {
           useMultipart: true
        }
        }).valueChanges.subscribe((json: any) => {
          face(track)
          this.id++
          if (typeof json.data.face.names !== 'undefined') {
            console.log(typeof json.data.face.names, json.data.face)
            // @ts-ignore
            ctx!.reset()
            let f = ""
            json.data.face.names.forEach((name: string) => {
              f = f + ' ' + name.split('.')[0]
              Object.values(json.data.face.landmarks[name]).forEach(values => {
                // @ts-ignore
                values.forEach(XY => {
                  ctx!.fillRect(XY[0], XY[1], 2, 2);
                })
              })
            })
            h2!.innerHTML = f
          }
        })
      })
    }
  }
}
