import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { RouteService } from '../services/route.service';
import { RouteModel } from '../models/route-model.model';
import { LatLng, LatLngExpression } from 'leaflet';
import { Subscription } from 'rxjs';

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

  private route! : RouteModel;
  private routeSubscriber!: Subscription;

  constructor(private renderer: Renderer2, private routeService : RouteService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.routeSubscriber = this.routeService.route$.subscribe((route) => {
      this.route = route;
      if(this.route.isReset){
        this.clearMap();
      }else{
        this.updateMap();
      }
    });
  }

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

    this.centerOnUserLocation();

    this.map.on('contextmenu',(event : L.LeafletMouseEvent) => {
      event.originalEvent.preventDefault();
      this.showContextMenu(event);
    })
  }

  private updateMap() : void {
    this.clearMap();

    //display markers
    this.route.markers?.forEach((marker) => {
      this.map.addLayer(marker.marker);
    })

    //display polyline
    this.drawRouteLine();
  }

  private clearMap() : void {
    //remove markers
    this.route.markers?.forEach((marker,index) => {
      if(this.map.hasLayer(marker.marker)){
        this.map.removeLayer(marker.marker);
      }
    });
    //remove polyline
    if(this.route.polyline && this.map.hasLayer(this.route.polyline)){
      this.map.removeLayer(this.route.polyline);
      this.route.polyline = undefined;
    }
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
          const startMarker = L.marker(this.selectedLatLng, {
            icon: L.icon({
              iconUrl: 'assets/icons/location-dot-solid.svg',
              iconSize: [24,24],
              iconAnchor: [12,12]
            }),
            draggable: true
          });
          const startPin = {
            'type': 'start',
            'streetname': '',
            'latlng': this.selectedLatLng,
            'marker': startMarker
          };
          this.getStreetName(this.selectedLatLng)
          .then(streetName => {
            startPin.streetname = streetName;
            startPin.marker.on('click', () => this.onMarkerClick(startPin.marker,startPin.marker.getLatLng(),startPin.streetname));
            startPin.marker.on('dragend', (event) => {
              const markerDragged = event.target;
              const newPosition = markerDragged.getLatLng();
              this.getStreetName(newPosition)
              .then(newStreetName => { 
                startPin.streetname = newStreetName; 
                startPin.latlng = newPosition; 
                this.routeService.updateRoute(this.route);
              });
            })
            this.route.markers?.push(startPin);
            this.routeService.updateRoute(this.route);
          })
          .catch(error => {
            console.log("Error:",error);
          });
          break;
        case 'marker':
          const markermarker = L.marker(this.selectedLatLng, {
            icon: L.icon({
              iconUrl: 'assets/icons/circle-dot-regular.svg',
              iconSize: [12,12],
              iconAnchor: [6,6]
            }),
            draggable: true
          });
          const markerpin = {
            'type': 'marker',
            'streetname': '',
            'latlng': this.selectedLatLng,
            'marker': markermarker
          };
          this.getStreetName(this.selectedLatLng).then(streetName => {
            markerpin.streetname = streetName;
            markerpin.marker.on('click', () => this.onMarkerClick(markerpin.marker,markerpin.marker.getLatLng(),markerpin.streetname));
            markerpin.marker.on('dragend', (event) => {
              const markerDragged = event.target;
              const newPosition = markerDragged.getLatLng();
              this.getStreetName(newPosition).then(newStreetName => {
                markerpin.streetname = newStreetName;
                markerpin.latlng = newPosition;
                this.routeService.updateRoute(this.route);
              })
            })
            this.route.markers?.push(markerpin);
            this.routeService.updateRoute(this.route);
          }).catch(error => {
            console.log("Error:",error);
          });
          break;
        case 'end':
          const endMarker = L.marker(this.selectedLatLng, {
            icon: L.icon({
              iconUrl: 'assets/icons/location-dot-solid.svg',
              iconSize: [24,24],
              iconAnchor: [12,12]
            }),
            draggable: true
          });
          const endPin = {
            'type': 'end',
            'streetname': '',
            'latlng': this.selectedLatLng,
            'marker': endMarker
          };
          this.getStreetName(this.selectedLatLng)
          .then(streetName => {
            endPin.streetname = streetName;
            endPin.marker.on('click', () => this.onMarkerClick(endPin.marker,endPin.marker.getLatLng(),endPin.streetname));
            endPin.marker.on('dragend', (event) => {
              const markerDragged = event.target;
              const newPosition = markerDragged.getLatLng();
              this.getStreetName(newPosition).then(newStreetName => {
                endPin.streetname = newStreetName;
                endPin.latlng = newPosition;
                this.routeService.updateRoute(this.route);
              });
            })
            this.route.markers?.push(endPin);
            this.routeService.updateRoute(this.route);
          })
          .catch(error => {
            console.log("Error:",error);
          });
          break;
        default:
          break;
      }
      console.log('Current Markers:',this.route.markers);
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

  private drawRouteLine() : void {
    this.routeService.generateLatLngForPolyline()
    .then(latlngs => {
      this.route.polyline = L.polyline(latlngs, {color: 'blue'});
      if(this.route.polyline){
        this.map.addLayer(this.route.polyline);
        this.map.fitBounds(this.route.polyline.getBounds());
      }
    }).catch(error => {
    });
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
    closeButton.innerHTML = '&times;'; 
    closeButton.className = 'custom-close-btn btn btn-sm';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#000';
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
      console.log('Selected Marker:',marker); 
      console.log('Markers before deleting 1:',this.route.markers);
      this.route.markers = this.route.markers?.filter(data => data.marker !== marker);
      console.log('Markers after deleting 1:',this.route.markers);
      this.routeService.updateRoute(this.route);
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

  centerOnUserLocation() : void {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            console.log(`User's location: ${userLat}, ${userLng}`);

            // Center the map on the user's location
            this.map.setView([userLat, userLng], 18);
        }, error => {
            console.error('Geolocation error:', error);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

}
