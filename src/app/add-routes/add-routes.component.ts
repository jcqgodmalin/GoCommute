import { Component } from '@angular/core';
import { MapComponent } from "../map/map.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../services/route.service';

@Component({
  selector: 'app-add-routes',
  standalone: true,
  imports: [MapComponent, CommonModule, FormsModule],
  templateUrl: './add-routes.component.html',
  styleUrl: './add-routes.component.css'
})
export class AddRoutesComponent {

  constructor(public routeService : RouteService) {}

  vehicleTypeChanged(vehicleType : string){
    this.routeService.route.vehicleType = vehicleType;
  }
}
