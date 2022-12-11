import { Component, OnInit } from '@angular/core';
import {setContext} from "@apollo/client/link/context";
import {Apollo} from "apollo-angular";
import { AuthService } from './shared/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // title = 'render';
  // apollo: Apollo;
  // auth: AuthService;
  // user: any;
  // loggedIn: boolean = false;
  //
  // constructor(apollo: Apollo, auth: AuthService){
  //   this.auth = auth;
  //   this.apollo = apollo;
  // }

  // ngOnInit(): void {
    // const auth = setContext(async(_, { headers }) => {
    //   // Grab token if there is one in storage or hasn't expired
    //   let token = this.auth.getToken();
    //
    //   if (!token) {
    //     // An observable to fetch a new token
    //     // Converted .toPromise()
    //     await this.auth.acquireToken().toPromise();
    //
    //     // Set new token to the response (adal puts the new token in storage when fetched)
    //     token = this.auth.getCachedAccessToken();
    //   }
    //   // Return the headers as usual
    //   return {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   };
    // });
  // }

  //  logout() {
  //   this.loggedIn = false;
  //   this.auth.logout();
  // }

}
