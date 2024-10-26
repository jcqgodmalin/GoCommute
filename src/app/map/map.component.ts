import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { RouteService } from '../services/route.service';
import { RouteModel } from '../models/route-model.model';
import { LatLng, LatLngExpression } from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit {
  @ViewChild('popoverContent', { static: false }) popoverContent!: ElementRef;

  private map!: L.Map;
  private contextMenu!: HTMLElement;
  private selectedLatLng!: L.LatLng;
  public selectedMarker : {lat: number, lng: number, name: string} | null = null;

  constructor(private renderer: Renderer2, private routeService : RouteService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() : void {
    this.initializeMap();

    this.contextMenu = document.getElementById('map-context-menu')!;
    this.renderer.listen(document, 'click', () => {
      this.hideContextMenu();
    });
  }

  initializeMap() : void {
    this.map = L.map('map',{zoomControl: false}).setView([14.5995, 120.9842], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('contextmenu',(event : L.LeafletMouseEvent) => {
      event.originalEvent.preventDefault();
      this.showContextMenu(event);
    })
  }

  showContextMenu(event : L.LeafletMouseEvent) : void {
    this.getNearestRoad(event.latlng.lat,event.latlng.lng).then(latlng => {
      this.selectedLatLng = latlng;
    }).catch(error => {
      console.log("Error: ",error);
    });
    // Get the position of the right-click event
    const { containerPoint } = event;
    const { x, y } = containerPoint;

    // Show the context menu at the click position
    this.contextMenu.style.display = 'block';
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
  }

  hideContextMenu(): void {
    this.contextMenu.style.display = 'none';
  }

  addMarker(marker : string) : void {
    if(this.selectedLatLng){
      switch(marker){
        case 'start':
          this.routeService.route.startingpoint = this.selectedLatLng;
          this.getStreetName(this.selectedLatLng)
          .then(streetName => {
            this.routeService.route.startingpointStr = streetName;
          })
          .catch(error => {
            console.log("Error:",error);
          });
          const startMarker = L.marker(this.selectedLatLng, {
            icon: L.icon({
              iconUrl: 'assets/icons/location-dot-solid.svg',
              iconSize: [24,24],
              iconAnchor: [12,12]
            })
          }).addTo(this.map);

          startMarker.on('click', () => this.onMarkerClick(startMarker,startMarker.getLatLng(),this.routeService.route.startingpointStr!));

          break;
        case 'marker':
          const markerpin = {
            'type': 'marker',
            'streetname': '',
            'latlng': this.selectedLatLng
          };
          this.getStreetName(this.selectedLatLng).then(streetName => {
            markerpin.streetname = streetName;
          }).catch(error => {
            console.log("Error:",error);
          });
          this.routeService.route.straight_turning_markers?.push(markerpin);
          const markermarker = L.marker(this.selectedLatLng, {
            icon: L.icon({
              iconUrl: 'assets/icons/circle-dot-regular.svg',
              iconSize: [24,24],
              iconAnchor: [12,12]
            })
          }).addTo(this.map);

          markermarker.on('click', () => this.onMarkerClick(markermarker,markermarker.getLatLng(),markerpin.streetname));

          break;
        case 'turn':
          const turnpin = {
            'type': 'turn',
            'streetname': '',
            'latlng': this.selectedLatLng
          };
          this.getStreetName(this.selectedLatLng).then(streetName => {
            turnpin.streetname = streetName;
          }).catch(error => {
            console.log("Error:",error);
          });
          this.routeService.route.straight_turning_markers?.push(turnpin);
          const turnMarker = L.marker(this.selectedLatLng, {
            icon: L.icon({
              iconUrl: 'assets/icons/arrows-left-right-solid.svg',
              iconSize: [24,24],
              iconAnchor: [12,12]
            })
          }).addTo(this.map);

          turnMarker.on('click', () => this.onMarkerClick(turnMarker,turnMarker.getLatLng(),turnpin.streetname));

          break;
        case 'end':
          this.routeService.route.endpoint = this.selectedLatLng;
          this.getStreetName(this.selectedLatLng)
          .then(streetName => {
            this.routeService.route.endpointStr = streetName;
          })
          .catch(error => {
            console.log("Error:",error);
          });
          console.log('Endpoint Street Name: ',this.routeService.route.endpointStr);
          const endMarker = L.marker(this.selectedLatLng, {
            icon: L.icon({
              iconUrl: 'assets/icons/location-dot-solid.svg',
              iconSize: [24,24],
              iconAnchor: [12,12]
            })
          }).addTo(this.map);
          endMarker.on('click', () => this.onMarkerClick(endMarker,endMarker.getLatLng(),this.routeService.route.endpointStr!));
          this.drawRouteLine(this.routeService.route);
          break;
        default:
          break;

      }
    }
    this.hideContextMenu();
  }

  private getNearestRoad(lat: number, lng: number) : Promise<L.LatLng> {
    return new Promise((resolve,reject) => {
      const osrmUrl = `http://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`;
      fetch(osrmUrl)
      .then(response => {
        if(!response.ok){
          throw new Error('Unable to reach the server');
        }
        return response.json();
      })
      .then(data => {
        if(data.waypoints && data.waypoints.length > 0) {
          const nearestRoad = data.waypoints[0].location;
          const latLng = L.latLng(nearestRoad[1],nearestRoad[0]);
          resolve(latLng);
        }else{
          reject(new Error('No Road Found'));
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  private getStreetName(latLng: L.LatLng) : Promise<string> {
    return new Promise((resolve,reject) => {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latLng.lat}&lon=${latLng.lng}&format=json`;
      fetch(nominatimUrl)
      .then(response => {
        if(!response.ok){
          throw new Error('Unable to reach the server');
        }
        return response.json();
      })
      .then(data => {
        if(data && data.address && data.address.road) {
          resolve(data.address.road);
        }else{
          resolve('Unknown Road/Street');
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  private drawRouteLine(route : RouteModel) : void {
    const start = route.startingpoint;
    const end = route.endpoint;
    const waypoints = route.straight_turning_markers;

    if(!start || !Array.isArray(waypoints) || waypoints.length < 0){
      console.log('No start or no way points!');
      return;
    }

    let lastWaypoint;
    if(waypoints.length > 0){
      lastWaypoint = waypoints[waypoints.length - 1].latlng;
    }
    const finalEndPoint = end || lastWaypoint;

    console.log('Starting Point:',start);
    console.log('Waypoints:',waypoints);
    console.log('Final End Point:',finalEndPoint);

    const wayPointStr = waypoints.map(point => `${point.latlng.lng},${point.latlng.lat}`).join(';');
    console.log('WaypointStr:',wayPointStr);

    let queryParam;
    if(wayPointStr){
      queryParam = `${start.lng},${start.lat};${wayPointStr};${finalEndPoint.lng},${finalEndPoint.lat}`;
    }else{
      queryParam = `${start.lng},${start.lat};${finalEndPoint.lng},${finalEndPoint.lat}`;
    }

    console.log('QueryParam:',queryParam);

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
        const latLngs : LatLngExpression[] = coordinates.map(coord => [coord.lat, coord.lng]);
        const polyline = L.polyline(latLngs, {color: 'blue'}).addTo(this.map);
        this.map.fitBounds(polyline.getBounds());
      }else{
        console.error('No routes found:',data);
      }
    })
    .catch(error => {
      console.error("Error:",error);
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

  onMarkerClick(marker: L.Marker, latlng: LatLng, name: string): void {
    this.selectedMarker = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: name
    };

     // Force Angular to detect changes
    this.cdr.detectChanges();

    this.showPopover(marker,latlng);
  }

  private showPopover(marker: L.Marker, latlng: LatLng): void {
    if (!this.popoverContent) return;

    // Create a div to hold the popover content
    const popoverDiv = this.popoverContent.nativeElement.cloneNode(true);
    popoverDiv.style.display = 'block';

    // Add a custom close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;'; // Use HTML entity for "X"
    closeButton.className = 'custom-close-btn btn btn-sm'; // Use Bootstrap classes for basic styling
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#000'; // Adjust color as needed
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', () => {
      this.map.closePopup();
    });

    // Add a custom close button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.className = 'btn btn-sm btn-danger'; // Use Bootstrap classes for styling
    removeButton.style.marginTop = '10px';

    removeButton.addEventListener('click',() => {
      this.map.removeLayer(marker);
      this.map.closePopup();
    })
  
    popoverDiv.appendChild(closeButton);
  
    popoverDiv.appendChild(removeButton);

    // Remove any existing popups to ensure the content is updated
    this.map.closePopup();

    // Use Leaflet's L.popup to bind the content to the map at the specified location
    const popup = L.popup({
      closeButton: false,
      autoClose: true,
      closeOnClick: false,
      offset: L.point(0, -20) // Adjust the offset to position the popover correctly
    })
    .setLatLng(latlng)
    .setContent(popoverDiv)
    .openOn(this.map);
  }

}
