import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { RouteService } from '../services/route.service';
import { RouteModel } from '../models/route-model.model';
import { LatLng } from 'leaflet';
import { Subscription } from 'rxjs';
import { MarkerModel } from '../models/marker-model.model';
import { MarkerService } from '../services/marker.service';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BreakpointObserverService } from '../services/breakpoint-observer.service';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit {
  @ViewChild('popoverContent', { static: false }) popoverContent!: ElementRef;

  isMobileDevice: boolean = false;
  isAddRouteActive : boolean = false;

  private map!: L.Map;
  mapLoading = false;
  private contextMenu!: HTMLElement;
  private selectedLatLng!: L.LatLng;
  public selectedMarker : {lat: number, lng: number, name: string} | null = null;
  private polyline : any;
  private currentPopUp : L.Popup | null = null;

  private route! : RouteModel;
  private routeSubscriber!: Subscription;

  private markerSubscriber!: Subscription;

  constructor(
    private renderer: Renderer2,
    private routeService : RouteService,
    private markerService : MarkerService,private cdr: ChangeDetectorRef,
    private deviceObserver : BreakpointObserverService,
    private router : Router
  ) {
    
    this.deviceObserver.isMobile$.subscribe(result=>{
      this.isMobileDevice = result;
    })
  }

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.checkCurrentRoute();
    })
    this.routeSubscriber = this.routeService.route$.subscribe((route) => {
      this.route = route;
      if(this.route.isReset){
        this.clearMap();
      }else{
        this.updateMap();
      }
    });
    // this.markerSubscriber = this.markerService.markerClicked$.subscribe(marker => {
    //     //do something when a marker is clicked
    //     this.onMarkerClick(marker.mapMarker,marker.mapMarker.getLatLng(), marker.streetname);
    // });
    // this.markerSubscriber.add(this.markerService.markerHovered$.subscribe(marker => {
    //   //do something when a marker is hovered
    // }));
  }

  ngOnDestroy() {
    this.routeSubscriber.unsubscribe();
    this.markerSubscriber.unsubscribe();
  }

  ngAfterViewInit() : void {
    this.initializeMap();

    this.contextMenu = document.getElementById('map-context-menu')!;
    this.renderer.listen(document, 'click', () => {
      this.hideContextMenu();
    });
  }

  checkCurrentRoute() : void {
    this.isAddRouteActive = this.router.url.includes('/addroutes');
  }

  initializeMap() : void {
    this.mapLoading = true;
    this.cdr.detectChanges();

    this.map = L.map('map',{zoomControl: false}).setView([14.5995, 120.9842], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.centerOnUserLocation();

    this.map.on('contextmenu',(event : L.LeafletMouseEvent) => {
      if(this.isAddRouteActive){
        event.originalEvent.preventDefault();
        this.showContextMenu(event);
      }
    })

    setTimeout(() => {
      this.mapLoading = false
      this.cdr.detectChanges();
    }, 10000);
  }

  private updateMap() : void {
    this.mapLoading = true;
    this.clearMap();

    //display markers
    const startIcon: L.Icon = L.icon({
      iconUrl: 'assets/icons/map-pin-start.svg', 
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const endIcon: L.Icon = L.icon({
      iconUrl: 'assets/icons/map-pin-end.svg', 
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const waypointIcon: L.Icon = L.icon({
      iconUrl: 'assets/icons/circle-dot-regular.svg', 
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    
    if(this.route.markers){
      const markerCount = this.route.markers?.length;
      this.route.markers?.forEach((marker: MarkerModel, index: number) => {
        if(index === 0){
          marker.mapMarker.setIcon(startIcon);
        }else if(index === (markerCount - 1)){
          marker.mapMarker.setIcon(endIcon);
        }else{
          marker.mapMarker.setIcon(waypointIcon);
        }
        this.map.addLayer(marker.mapMarker);
      })
    }
    
    //display polyline
    this.drawRouteLine();

    this.mapLoading = false;
  }

  private clearMap() : void {
    this.mapLoading = true;
    //remove markers
    this.route.markers?.forEach((marker,index) => {
      if(this.map.hasLayer(marker.mapMarker)){
        this.map.removeLayer(marker.mapMarker);
      }
    });
    //remove polyline
    if(this.polyline && this.map.hasLayer(this.polyline)){
      this.map.removeLayer(this.polyline);
      this.polyline = undefined;
    }

    if(this.currentPopUp){
      this.map.closePopup();
    }
    this.mapLoading = false;
  }

  showContextMenu(event : L.LeafletMouseEvent) : void {
    this.getNearestRoad(event.latlng.lat,event.latlng.lng).then(latlng => {
      this.selectedLatLng = latlng;
    }).catch(error => {
      console.log("Error: ",error);
    });

    const { clientX, clientY } = event.originalEvent;

    // Show the context menu at the click position
    this.contextMenu.style.display = 'block';
    this.contextMenu.style.left = `${clientX}px`;
    this.contextMenu.style.top = `${clientY}px`;
  }

  hideContextMenu(): void {
    this.contextMenu.style.display = 'none';
  }

  addMarker() : void {
    const marker = L.marker(this.selectedLatLng, {
      draggable: true
    });
    const startPin : MarkerModel = {
      'streetname': '',
      'lat': this.selectedLatLng.lat,
      'lng': this.selectedLatLng.lng
    };
    this.getStreetName(this.selectedLatLng).then(streetName => {
      startPin.streetname = streetName;
      marker.on('click', () => this.onMarkerClick(marker,marker.getLatLng(),streetName));
      marker.on('dragend', (event) => {
        const markerDragged = event.target;
        const newPosition = markerDragged.getLatLng();
        this.getNearestRoad(newPosition.lat,newPosition.lng).then(latlng => {
          this.getStreetName(latlng).then(newStreetName => {
            startPin.streetname = newStreetName;
            //startPin.mapMarker.setLatLng(latlng);
            this.routeService.updateRoute(this.route);
          });
        });
      });
      this.route.markers?.push(startPin);
      this.routeService.updateRoute(this.route);
    }).catch(error => {
      console.log("Error:",error);
    });
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
      this.polyline = L.polyline(latlngs, {color: 'blue'});
      if(this.polyline){
        this.map.addLayer(this.polyline);
        this.map.fitBounds(this.polyline.getBounds());
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

    this.cdr.detectChanges();

    this.showPopover(marker,latlng);
  }

  private showPopover(marker: L.Marker, latlng: LatLng): void {
    if (!this.popoverContent) return;

    const popoverDiv = this.popoverContent.nativeElement.cloneNode(true);
    popoverDiv.style.display = 'block';

    // Custom Close button
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

    // Custom Remove button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.className = 'btn btn-sm btn-danger'; // Use Bootstrap classes for styling
    removeButton.style.marginTop = '10px';

    removeButton.addEventListener('click',() => {
      this.route.markers = this.route.markers?.filter(data => data.mapMarker !== marker);
      this.routeService.updateRoute(this.route);
      this.map.removeLayer(marker);
      this.map.closePopup();
    })
  
    popoverDiv.appendChild(closeButton);
  
    popoverDiv.appendChild(removeButton);

    // Remove any existing popups to ensure the content is updated
    this.map.closePopup();

    // Use Leaflet's L.popup to bind the content to the map at the specified location
    this.currentPopUp = L.popup({
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
