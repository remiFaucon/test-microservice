import {UploadedFile} from "express-fileupload";

declare global{
  namespace Express {
   // export interface Request {
   //    files?: <fileUpload extends T>
   // }
}
}