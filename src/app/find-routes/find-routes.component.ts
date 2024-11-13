import { Component } from '@angular/core';
import { RouteModel } from '../models/route-model.model';
import { CommonModule } from '@angular/common';
import { CommuteService } from '../services/commute.service';
import { CommuteModel } from '../models/commute-model.model';
import { Subscription } from 'rxjs';
import { GoCommuteAPI } from '../services/GoCommute-API.service';

@Component({
  selector: 'app-find-routes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './find-routes.component.html',
  styleUrl: './find-routes.component.css'
})
export class FindRoutesComponent {

  useUserLocationAsStartingPoint : boolean = false;
  commute! : CommuteModel;

  isFindingRoute: boolean = false;

  private commuteSubscriber! : Subscription;

  constructor(private commuteService : CommuteService, private goCommuteAPIService : GoCommuteAPI) {
    this.commuteSubscriber = this.commuteService.commute$.subscribe(commute => {
      this.commute = commute;
      if(this.commute.userDestinationLat > 0 && this.commute.userLocationLat > 0){
        this.isFindingRoute = true;
        if(this.commute.recommendRoutes){
          this.isFindingRoute = false;
        }
      }
    })

    this.goCommuteAPIService.getRoutes().then(data => {
      console.log(data);
    });
  }

  locationSwitched(checked : boolean) : void {
    this.useUserLocationAsStartingPoint = checked;
    this.commuteService.userLocationSwitch(checked);
    if(!this.useUserLocationAsStartingPoint){
      this.commute.userLocationLat = 0;
      this.commute.userLocationLng = 0;
      this.commuteService.updateCommute(this.commute);
    }
  }

  search(destination : string) : void {
    if(this.useUserLocationAsStartingPoint){

    }
    console.log('You searched ' + destination);
  }

}
