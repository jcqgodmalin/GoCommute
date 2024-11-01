import { Injectable } from '@angular/core';
import { RouteModel } from '../models/route-model.model';
import { MarkerModel } from '../models/marker-model.model';
import { BehaviorSubject } from 'rxjs';
import { LatLngExpression, Marker } from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private route : RouteModel = {
    vehicleType : '',
    markers: [],
    isReset: false
  }
  private routeSubject = new BehaviorSubject<RouteModel>(this.route);
  route$ = this.routeSubject.asObservable();

  updateRoute(route: RouteModel) : void {
    this.route = route;
    this.routeSubject.next(this.route);
  }

  saveRoute(route: RouteModel) : void {
    console.log('Route object to be sent to backend',this.route);
  }
 
  resetRoute() : void {
    this.route.isReset = true;
    this.routeSubject.next(this.route);
    this.route.isReset = false;
    this.route.markers = [];
    this.route.latlngs = [];
    console.log('Route object from route service',this.route);
  }

  //Polyline section -- START

  generateLatLngForPolyline() : Promise<LatLngExpression[]> {

    return new Promise((resolve,reject) => {
      if(this.route.markers){
        if(this.route.markers.length > 1){

          const markersCount = this.route.markers.length;
          let start! : MarkerModel;
          let waypoints : MarkerModel[] = [];
          let end! : MarkerModel;

          this.route.markers.forEach((marker: MarkerModel,index : number) => {

            if(index === 0){
              start = marker;
            }else if(index === markersCount - 1){
              end = marker;
            }else if(index !== 0 && index !== markersCount -1){
              waypoints.push(marker);
            }

          });

          //check if waypoints array is populated. If yes, populate the waypointString
          let waypointsString;
          if(waypoints.length > 0){
            waypointsString = waypoints.map(waypoint => `${waypoint.lng},${waypoint.lat}`).join(';');
          }

          //compose the query parameter to  osrm
          let osrmQueryParameter! : string;
          if(start && end){
            if(waypointsString){
              osrmQueryParameter = `${start.lng},${start.lat};${waypointsString};${end.lng},${end.lat}`;
            }else{
              osrmQueryParameter = `${start.lng},${start.lat};${end.lng},${end.lat}`;
            }
          }else{
            reject();
          }

          //call osrm
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmQueryParameter}?overview=full`;
          fetch(osrmUrl).then(response => {
            if(!response.ok){
              throw new Error('Unable to reach the OSRM server');
            }
            return response.json();
          }).then(data => {
            if(data.routes && Array.isArray(data.routes) && data.routes.length > 0){
              const route = data.routes[0];
              const coordinates = this.decodePolyline(route.geometry);
              const latlng : LatLngExpression[] = coordinates.map(coord => [coord.lat, coord.lng]);
              this.route.latlngs = latlng;
              resolve(latlng);
            }else{
              throw new Error('No route found');
            }
          }).catch(error => {
            reject(error);
          });
        }
      }
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
