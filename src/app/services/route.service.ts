import { Injectable } from '@angular/core';
import { RouteModel } from '../models/route-model.model';
import { BehaviorSubject } from 'rxjs';
import { Route } from '@angular/router';
import { LatLngExpression } from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  public route : RouteModel = {
    vehicleType : '',
    markers: [],
    polyline: undefined,
    isReset: false
  }
  private routeSubject = new BehaviorSubject<RouteModel>(this.route);
  route$ = this.routeSubject.asObservable();

  updateRoute(route: RouteModel) : void {
    this.route = route;
    this.routeSubject.next(this.route);
  }

  resetRoute() : void {
    this.route.isReset = true;
    this.routeSubject.next(this.route);
    this.route.isReset = false;
    this.route.markers = [];
  }

  //Polyline section -- START

  generateLatLngForPolyline() : Promise<LatLngExpression[]> {

    return new Promise((resolve,reject) => {
      const start = this.route.markers?.find(start => start.type === 'start');
      const end = this.route.markers?.find(end => end.type === 'end');
      const waypoints = this.route.markers?.filter(waypoints => waypoints.type === 'marker');

      if(waypoints && !start || !end){
        reject();
      }

      const wayPointStr = waypoints?.map(point => `${point.latlng.lng},${point.latlng.lat}`).join(';');
      let queryParam;
      if(wayPointStr){
        queryParam = `${start.latlng.lng},${start.latlng.lat};${wayPointStr};${end.latlng.lng},${end.latlng.lat}`;
      }else{
        queryParam = `${start.latlng.lng},${start.latlng.lat};${end.latlng.lng},${end.latlng.lat}`;
      }

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${queryParam}?overview=full`;
      fetch(osrmUrl)
      .then(response => {
        if(!response.ok){
          throw new Error('Unable to reach the server');
        }
        return response.json();
      })
      .then(data => {
        if(data.routes && Array.isArray(data.routes) && data.routes.length > 0){
          const route = data.routes[0];
          const coordinates = this.decodePolyline(route.geometry);
          resolve(coordinates.map(coord => [coord.lat, coord.lng]));
        }else{
          throw new Error('No route found');
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  private decodePolyline(encoded : string) : {lat: number, lng: number}[] {
    const coordinates: { lat: number, lng: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;

      // Decode longitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      const point = {
        lat: lat / 1e5,
        lng: lng / 1e5
      };

      coordinates.push(point);
    }

    return coordinates;
  }

  //Polyline section -- END

} 
