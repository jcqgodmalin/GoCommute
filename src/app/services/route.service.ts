import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { RouteModel } from '../models/route-model.model';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  public route : RouteModel = {
    vehicleType: '',
    startingpointStr: '0',
    endpointStr: '0',
    straight_turning_markers: []
  }
}
