import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../services/route.service';
import { RouteModel } from '../models/route-model.model';

@Component({
  selector: 'app-add-routes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-routes.component.html',
  styleUrl: './add-routes.component.css'
})
export class AddRoutesComponent {

  route! : RouteModel;

  constructor(public routeService : RouteService, private cdr: ChangeDetectorRef) {
    this.routeService.route$.subscribe((route) => {
      this.route = route;
    });
  }

  vehicleTypeChanged(vehicleType : string){
    this.route.vehicleType = vehicleType;
  }

  getStartStreetName() : string | null {
    const startMarker = this.route.markers?.find(marker => marker.type === 'start');
    return startMarker ?  startMarker.streetname : null;
  }

  getEndStreetName() : string | null {
    const endMarker = this.route.markers?.find(marker => marker.type === 'end');
    return endMarker ?  endMarker.streetname : null;
  }

  getMarkers() : any[] | undefined {
    return this.route.markers?.filter(markers => markers.type === 'marker');
  }

  reset() : void {
    this.route.vehicleType = '';
    this.route.busName = '';
    this.route.routeNumber = '';
    this.routeService.resetRoute();
  }
}
