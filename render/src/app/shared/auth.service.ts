import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import {Apollo, gql} from "apollo-angular";
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  endpoint: string = 'http://localhost:4000/';
  headers = new HttpHeaders().set('Content-Type', 'application/json');
  currentUser = {};
  constructor(private http: HttpClient, public router: Router,public apollo: Apollo) {}
  // Sign-up
  signUp(user: any): Observable<any> {
    let api = `${this.endpoint}/register-user`;
    return this.http.post(api, user).pipe(catchError(this.handleError));
  }



  // Sign-in
  signIn(user: any) {
    // return this.http
    //   .post<any>(`${this.endpoint}/signin`, user)
    //   .subscribe((res: any) => {
    //     localStorage.setItem('access_token', res.token);
    //     this.getUserProfile(res._id).subscribe((res) => {
    //       this.currentUser = res;
    //       this.router.navigate(['user-profile/' + res.msg._id]);
    //     });
    //   });
    console.log(`${user}`);
    this.apollo
        .mutate({
          mutation: gql`
            mutation {
              login(user: {name: "${user.name}", email: "${user.email}", password: "${user.password}"}) {
                uuid
              }
            }`
        }).subscribe((res: any) => {
          console.log(res)
          localStorage.setItem('access_token', res.data.token);
          // this.getUserProfile(res.data._id).subscribe((res) => {
          this.currentUser = res.data.user;
          this.router.navigate(['']);
          // });
        })
  }

  getToken() {
    return localStorage.getItem('access_token');
  }

  get isLoggedIn(): boolean {
    let authToken = localStorage.getItem('access_token');
    return authToken !== null;
  }

  doLogout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['login']);
  }
  // // User profile
  // getUserProfile(id: any): Observable<any> {
  //   let api = `${this.endpoint}/user-profile/${id}`;
  //   return this.http.get(api, { headers: this.headers }).pipe(
  //     map((res) => {
  //       return res || {};
  //     }),
  //     catchError(this.handleError)
  //   );
  // }
  // Error
  handleError(error: HttpErrorResponse) {
    let msg = '';
    if (error.error instanceof ErrorEvent) {
      // client-side error
      msg = error.error.message;
    } else {
      // server-side error
      msg = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(msg);
  }
}
