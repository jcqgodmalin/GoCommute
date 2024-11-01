import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BreakpointObserverService {

  private isMobile = new BehaviorSubject<boolean>(false);
  public isMobile$ = this.isMobile.asObservable();

  constructor(private breakpointObserver : BreakpointObserver){
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.next(result.matches);
    })
  }
}
