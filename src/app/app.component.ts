import { Component, OnInit } from '@angular/core';
import { ServerService } from './service/server.service';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { AppState } from './interface/app-status';
import { CostumResponse } from './interface/costum-response';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { NgForm } from '@angular/forms';
import { Server } from './interface/Server';
import { NotifierService } from 'angular-notifier';
import { NotificationService } from './service/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CostumResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CostumResponse>(null);
  filterStatus$= this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$= this.isLoading.asObservable();


  constructor(private serverService: ServerService, private  notifier : NotificationService){}

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
    .pipe(
      map(
        response => {
          this.dataSubject.next(response);
          this.notifier.onDefault(response.message);
          // this ...response means: give me everything from the response
          return {dataState: DataState.LOADED_STATE, appData: {...response, data: { servers: response.data.servers.reverse()}}}
        }),
      startWith(
        {dataState: DataState.LOADING_STATE}
      ),
      catchError((error: string) => {
        this.notifier.onError(error);
        return of({dataState: DataState.ERROR_STATE, error})
      })
    );
  }

  pingServer(ipAddres: string): void {
    this.filterSubject.next(ipAddres);
    this.appState$ = this.serverService.ping$(ipAddres)
    .pipe(
      map(
        response => {
          this.dataSubject.value.data.servers[
            this.dataSubject.value.data.servers.findIndex(
              server => server.id === response.data.server.id
            )
          ] = response.data.server;
          this.filterSubject.next('');
          this.notifier.onDefault(response.message);
          return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
        }),
      startWith(
        {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
      ),
      catchError((error: string) => {
        this.filterSubject.next('');
        this.notifier.onError(error);
        return of({dataState: DataState.ERROR_STATE, error})
      })
    );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value)
    .pipe(
      map(
        response => {
          this.dataSubject.next(
            {...response, data: {servers: [response.data.server, ...this.dataSubject.value.data.servers]}}
          );
          document.getElementById('closeModal').click();
          this.isLoading.next(false);
          serverForm.resetForm({status: this.Status.SERVER_DOWN});
          this.notifier.onDefault(response.message);
          return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
        }),
      startWith(
        {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
      ),
      catchError((error: string) => {
        this.isLoading.next(false);
        this.notifier.onError(error);
        return of({dataState: DataState.ERROR_STATE, error})
      })
    );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
    .pipe(
      map(
        response => {
          this.notifier.onDefault(response.message);
          return {dataState: DataState.LOADED_STATE, appData: response}
        }),
      startWith(
        {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
      ),
      catchError((error: string) => {
        this.notifier.onError(error);
        return of({dataState: DataState.ERROR_STATE, error})
      })
    );
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
    .pipe(
      map(
        response => {
          this.dataSubject.next(
            { ...response, data: 
              {servers: this.dataSubject.value.data.servers.filter(s => s.id !== server.id)}}
          );
          this.notifier.onDefault(response.message);
          return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
        }),
      startWith(
        {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
      ),
      catchError((error: string) => {
        this.notifier.onError(error);
        return of({dataState: DataState.ERROR_STATE, error})
      })
    );
  }
  
  printReport(): void {
    this.notifier.onDefault('report Downloaded');
    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('servers');
    let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20' );
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ',' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink); 
  }

}
