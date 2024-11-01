import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../services/route.service';
import { RouteModel } from '../models/route-model.model';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MarkerModel } from '../models/marker-model.model';
import { MarkerService } from '../services/marker.service';
import { SelectionChange } from '@angular/cdk/collections';

@Component({
  selector: 'app-add-routes',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './add-routes.component.html',
  styleUrl: './add-routes.component.css'
})
export class AddRoutesComponent {
  @ViewChild('vehicleType') vehicleTypeEl!: ElementRef;
  @ViewChild('busName') busNameEl!: ElementRef;
  @ViewChild('routeNumber') routeNumberEl!: ElementRef;

  route! : RouteModel;

  constructor(public routeService : RouteService, private markerService : MarkerService, private cdr: ChangeDetectorRef) {
    this.routeService.route$.subscribe((route) => {
      this.route = route;
    });
  }

  private clearInvalids() : void {
    this.vehicleTypeEl.nativeElement.classList.remove('is-invalid');
    if(this.busNameEl){
      this.busNameEl.nativeElement.classList.remove('is-invalid');
    }
    if(this.routeNumberEl){
      this.routeNumberEl.nativeElement.classList.remove('is-invalid');
    }
    
  }

  vehicleTypeChange(vehicleType : string){
    this.clearInvalids();
    if(vehicleType){
      this.route.vehicleType = vehicleType;
      this.vehicleTypeEl.nativeElement.classList.remove('is-invalid');
    }else{
      this.vehicleTypeEl.nativeElement.classList.add('is-invalid');
    }
  }

  busNameChanged(busName : string){
    this.route.busName = busName;
  }

  routeNumberChanged(routeNumber : string){
    this.route.routeNumber = routeNumber;
  }

  saveRoute() : void {
    if(this.route.vehicleType){
      if(this.route.vehicleType === 'bus'){
        //bus
        if(!this.route.busName){
          this.busNameEl.nativeElement.classList.add('is-invalid');
        }else{
          this.routeService.updateRoute(this.route);
          this.routeService.saveRoute(this.route);
        }
      }else{
        //jeep
        if(!this.route.routeNumber){
          this.routeNumberEl.nativeElement.classList.add('is-invalid');
        }else{
          this.routeService.updateRoute(this.route);
          this.routeService.saveRoute(this.route);
        }
      }
    }else{
      this.vehicleTypeEl.nativeElement.classList.add('is-invalid');
      console.log('No vehicle type selected');
    }
  }

  draggeddrop(event: CdkDragDrop<any[]>){
    if(this.route.markers){
      moveItemInArray(this.route.markers,event.previousIndex,event.currentIndex);
      this.routeService.updateRoute(this.route);
    }
  }

  markerHovered(marker : MarkerModel) : void {
    this.markerService.emitHoveredMarker(marker);
  }

  markerClicked(marker : MarkerModel) : void {
    this.markerService.emitClickedMarker(marker);
  }

  reset() : void {
    this.route.vehicleType = '';
    this.clearInvalids();
    this.vehicleTypeEl.nativeElement.value = '';
    this.route.busName = '';
    this.route.routeNumber = '';
    this.routeService.resetRoute();
    console.log('Route object from add-route',this.route);
  }
}
