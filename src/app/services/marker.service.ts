import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MarkerModel } from '../models/marker-model.model';
import { Marker } from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  private markerHoveredSource = new Subject<MarkerModel>();
  markerHovered$ = this.markerHoveredSource.asObservable();

  private markerClickedSource = new Subject<MarkerModel>();
  markerClicked$ = this.markerClickedSource.asObservable();

  emitClickedMarker(marker: MarkerModel) {
    this.markerClickedSource.next(marker);
  }

  emitHoveredMarker(marker: MarkerModel) {
    this.markerHoveredSource.next(marker);
  }

}
