import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../services/route.service';
import { RouteModel } from '../models/route-model.model';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MarkerModel } from '../models/marker-model.model';
import { MarkerService } from '../services/marker.service';

@Component({
  selector: 'app-add-routes',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './add-routes.component.html',
  styleUrl: './add-routes.component.css'
})
export class AddRoutesComponent {

  route! : RouteModel;

  constructor(public routeService : RouteService, private markerService : MarkerService, private cdr: ChangeDetectorRef) {
    this.routeService.route$.subscribe((route) => {
      this.route = route;
    });
  }

  vehicleTypeChanged(vehicleType : string){
    this.route.vehicleType = vehicleType;
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
    this.route.busName = '';
    this.route.routeNumber = '';
    this.routeService.resetRoute();
  }
}
