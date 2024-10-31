import { CommonModule } from '@angular/common';
import { Component, Host, HostListener } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MapComponent } from './map/map.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { endWith } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, MapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  isMobileDevice : boolean = false;
  isSplitterResizing : boolean = false;
  splitterHeight : number = 0;
  maxHeight : number = window.innerHeight;
  startY = 0;
  initialHeight = 0;

  constructor(private breakpointObserver : BreakpointObserver){}

  ngOnInit(){
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobileDevice = result.matches;
      if(this.isMobileDevice){
        this.splitterHeight = 100;
      }
    });
  }

  onMouseDown(event: MouseEvent | TouchEvent){
    if(this.isMobileDevice){
      this.isSplitterResizing = true;
      this.startY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
      this.initialHeight = this.splitterHeight;
      event.preventDefault();
    }
  }

  @HostListener('document:mousemove',['$event'])
  @HostListener('document:touchmove',['$event'])
  onMouseMove(event: MouseEvent | TouchEvent){
    if(this.isSplitterResizing && this.isMobileDevice){

      const currentY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

      const newHeight = this.maxHeight - currentY;

      if(newHeight > this.maxHeight){
        this.splitterHeight = this.maxHeight;
      }else if( newHeight < 100) {
        this.splitterHeight = 100
      }else{
        this.splitterHeight = newHeight;
      }
    }
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onMouseUp(){
    this.isSplitterResizing = false;
  }

}
