import { Injectable } from '@angular/core';
import { CommuteModel } from '../models/commute-model.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommuteService {

  private commute : CommuteModel = {
    userLocationLat : 0,
    userLocationLng : 0,
    userLocationStreetName : '',
    userDestinationLat : 0,
    userDestinationLng : 0,
    userDestinationStreetName : '',
    recommendRoutes : []
  }

  private commuteSubject = new BehaviorSubject<CommuteModel>(this.commute);
  commute$ = this.commuteSubject.asObservable();

  public updateCommute(commute : CommuteModel) : void {
    this.commute = commute;
    this.commuteSubject.next(this.commute);
  }

  /* This area will emit a user location boolean that will be used by map component to determine if the map should be centered in the user's location */
  private useUserLocationSubject = new BehaviorSubject<boolean>(false);
  useUserLocation$ = this.useUserLocationSubject.asObservable();

  public userLocationSwitch(use : boolean) : void {
    this.useUserLocationSubject.next(use);
  }

}
