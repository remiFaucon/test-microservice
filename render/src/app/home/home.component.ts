import {Component, NgZone, AfterViewInit, ViewChild, ElementRef} from '@angular/core';
import {Apollo, gql} from "apollo-angular";
import {WebcamImage, WebcamInitError, WebcamModule} from 'ngx-webcam';
import {Observable, Subject} from "rxjs";
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
  private id: number = 0;
  @ViewChild('myCanvas') canvas: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('webcam') webcam: ElementRef | undefined
  @ViewChild('drop') drop: ElementRef<HTMLInputElement> | undefined
  private trigger: Subject<any> = new Subject();
  public webcamImage!: WebcamImage;
  h2: string | undefined
  private ctx: CanvasRenderingContext2D | null | undefined;
  private sysImage: string = "";

  constructor(private apollo: Apollo, private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.ctx = this.canvas!.nativeElement.getContext("2d");
    this.ctx!.fillStyle = "#FF0000";
    this.canvas!.nativeElement.width = 1000
    this.canvas!.nativeElement.height = 700
    this.getSnapshot()
  }
  public get invokeObservable(): Observable<any> {
    return this.trigger.asObservable();
  }
  captureImg(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.sysImage = webcamImage!.imageAsBase64;
  }
  public handleInitError(error: WebcamInitError): void {
    if (error.mediaStreamError && error.mediaStreamError.name === "NotAllowedError") {
      console.warn("Camera access was not allowed by user!");
    }
  }
  public getSnapshot(): void {
    this.trigger.next(void 0);
    this.face()
  }
  private face() {
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
        file: this.sysImage
      },
      context: {
        useMultipart: true
      }
    }).valueChanges.subscribe((json: any) => {
      this.getSnapshot()
      this.id++
      if (typeof json.data.face.names !== 'undefined') {
        // @ts-ignore
        this.ctx!.reset()
        let f = ""
        json.data.face.names.forEach((name: string) => {
          f = f + ' ' + name.split('.')[0]
          Object.values(json.data.face.landmarks[name]).forEach(values => {
            // @ts-ignore
            values.forEach(XY => {
              this.ctx!.fillRect(XY[0], XY[1], 2, 2);
            })
          })
        })
        this.h2 = f
      }
    })
  }

  public ajax_file_upload(files_obj: any) {
    const reader = new FileReader();
    reader.readAsDataURL(files_obj.target.files[0]);
    reader.onload = () => {

      this.apollo
      .watchQuery({
        query: gql`
          query ($file: Upload!, $name: String!) {
            addRecognizablePerson(image: $file, name: $name)
          }
        `,
        variables: {
          name: "remi",
          file: reader.result
        },
        context: {
          useMultipart: true
        }
      }).valueChanges.subscribe((response) => {
        console.log(response)
      })
    }
  }
}
