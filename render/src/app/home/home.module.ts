import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import {APOLLO_OPTIONS} from "apollo-angular";
import {HttpLink} from "apollo-angular/http";
import {InMemoryCache} from "@apollo/client/core";
// @ts-ignore
import * as extract from "extract-files/extractFiles.mjs";
// @ts-ignore
import * as extractable from "extract-files/isExtractableFile.mjs";
import {HomeRoutingModule} from "./home-routing.module";
import {GraphQLModule} from "../graphql.module";
import {HttpHeaders} from "@angular/common/http";



@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
     CommonModule,
     GraphQLModule,
     HomeRoutingModule
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory(httpLink: HttpLink) {
        return {
          cache: new InMemoryCache(),
          link: httpLink.create({
            headers: new HttpHeaders({'Content-Type': 'multipart/form-data',/* 'Access-Control-Allow-Headers': 'Authorization'*/}),
            uri: 'http://localhost:5000/graphql',
            extractFiles: (body) => {
              console.log(extract.default(body, extractable.default))
              return extract.default(body, extractable.default)
            }
          })
        }
      },
      deps: [HttpLink]
    }
  ],
  bootstrap: [HomeComponent]
})
export class HomeModule { }
