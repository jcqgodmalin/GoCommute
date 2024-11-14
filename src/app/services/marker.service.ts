import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Marker } from 'leaflet';
import { MarkerModelNew } from '../models/route.model';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  private markerHoveredSource = new Subject<MarkerModelNew>();
  markerHovered$ = this.markerHoveredSource.asObservable();

  private markerClickedSource = new Subject<MarkerModelNew>();
  markerClicked$ = this.markerClickedSource.asObservable();

  emitClickedMarker(marker: MarkerModelNew) {
    this.markerClickedSource.next(marker);
  }

  emitHoveredMarker(marker: MarkerModelNew) {
    this.markerHoveredSource.next(marker);
  }

}
