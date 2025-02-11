import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, Subscriber, tap, throwError } from 'rxjs';
import { CostumResponse } from '../interface/costum-response';
import { Server } from '../interface/Server';
import { Status } from '../enum/status.enum';

@Injectable({
  providedIn: 'root'
})
export class ServerService {
  private readonly apiUrl= 'http://localhost:8080';
  
  constructor(private http: HttpClient) { }
  
  /* here we created an observable called server that captured 
  * the processed data of type CostumResponse send by the backend 
  */
  servers$ = <Observable<CostumResponse>>
  this.http.get<CostumResponse>(`${this.apiUrl}/server/list`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  save$ = (server:Server) => <Observable<CostumResponse>>
  this.http.post<CostumResponse>(`${this.apiUrl}/server/save`, server)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  ping$ = (ipAddress:string) => <Observable<CostumResponse>>
  this.http.get<CostumResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  filter$ = (status: Status, response: CostumResponse): Observable<CostumResponse> =>
    new Observable<CostumResponse>(subscriber => {
      const filteredServers = status === Status.ALL 
        ? response.data.servers 
        : response.data.servers.filter(server => server.status === status);
  
      subscriber.next({
        ...response,
        data: { servers: filteredServers },
        message: `Filtered by ${status}`
      });
  
      subscriber.complete();
    }).pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  delete$ = (serverId:number) => <Observable<CostumResponse>>
  this.http.delete<CostumResponse>(`${this.apiUrl}/server/delete/${serverId}`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error)
    return throwError(() => new Error(`An error occurred - Error code: ${error.status}`));
  }

  
  

}
