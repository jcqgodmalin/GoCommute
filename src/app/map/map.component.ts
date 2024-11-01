import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { RouteService } from '../services/route.service';
import { RouteModel } from '../models/route-model.model';
import { LatLng } from 'leaflet';
import { Subscription } from 'rxjs';
import { MarkerModel } from '../models/marker-model.model';
import { MarkerService } from '../services/marker.service';
import { CommonModule } from '@angular/common';
import { BreakpointObserverService } from '../services/breakpoint-observer.service';
import { Router } from '@angular/router';
import { CommuteService } from '../services/commute.service';
import { CommuteModel } from '../models/commute-model.model';

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
  isFindRouteActive : boolean = false;

  private map!: L.Map;
  mapLoading = false;
  private contextMenu!: HTMLElement;
  private selectedLatLng!: L.LatLng;
  public selectedMarker : {lat: number, lng: number, name: string} | null = null;
  private polyline : any;
  private currentPopUp : L.Popup | null = null;
  private markerMapping : Map<string, L.Marker> = new Map();

  private route! : RouteModel;
  private commute! : CommuteModel;

  private routeSubscriber!: Subscription;
  private markerSubscriber!: Subscription;
  private useUserLocationSubscriber!: Subscription;
  private commuteSubscriber!: Subscription;

  constructor(
    private renderer: Renderer2,
    private routeService : RouteService,
    private markerService : MarkerService,
    private cdr: ChangeDetectorRef,
    private deviceObserver : BreakpointObserverService,
    private router : Router,
    private commuteService : CommuteService
  ) {
    
    this.deviceObserver.isMobile$.subscribe(result=>{
      this.isMobileDevice = result;
    })
  }

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.checkCurrentRoute();
      this.clearMap();
    });
    this.routeSubscriber = this.routeService.route$.subscribe((route) => {
      this.route = route;
      if(this.route.isReset){
        this.clearMap();
        console.log("Route object in Map Component",this.route);
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

    this.useUserLocationSubscriber = this.commuteService.useUserLocation$.subscribe(useLocation => {
      if(useLocation){
        this.centerOnUserLocation(true);
      }
    });

    this.commuteSubscriber = this.commuteService.commute$.subscribe(commute => {
      this.commute = commute;
    });
  }

  checkCurrentRoute() : void {
    this.isAddRouteActive = this.router.url.includes('/addroutes');
    this.isFindRouteActive = this.router.url.includes('/findroutes');
  }

  initializeMap() : void {
    this.mapLoading = true;
    this.cdr.detectChanges();

    this.map = L.map('map',{zoomControl: false}).setView([14.5995, 120.9842], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('contextmenu',(event : L.LeafletMouseEvent) => {
        event.originalEvent.preventDefault();
        this.showContextMenu(event);
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
        let pin : L.Marker;
        if(index === 0){
          pin = L.marker([marker.lat,marker.lng],{
            icon: startIcon,
            draggable: true
          }).addTo(this.map);
          pin.on('click', () => this.onMarkerClick(pin, pin.getLatLng(), marker.streetname));
          pin.on('dragend', () => {
            this.onMarkerDragEnd(pin,marker.lat,marker.lng);
          });
        }else if(index === (markerCount - 1)){
          pin = L.marker([marker.lat,marker.lng], {
            icon: endIcon,
            draggable: true
          }).addTo(this.map);
          pin.on('click', () => this.onMarkerClick(pin, pin.getLatLng(), marker.streetname));
          pin.on('dragend', () => {
            this.onMarkerDragEnd(pin,marker.lat,marker.lng);
          });
        }else{
          pin = L.marker([marker.lat,marker.lng], {
            icon: waypointIcon,
            draggable: true
          }).addTo(this.map);
          pin.on('click', () => this.onMarkerClick(pin, pin.getLatLng(), marker.streetname));
          pin.on('dragend', () => {
            this.onMarkerDragEnd(pin,marker.lat,marker.lng);
          });
        }
        this.markerMapping.set(`${marker.lat,marker.lng}`,pin);
      });
    }
    
    //display polyline
    this.drawRouteLine();

    this.mapLoading = false;
  }

  private clearMap() : void {
    this.mapLoading = true;
    //remove markers
    this.markerMapping.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markerMapping.clear();

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
    const startPin : MarkerModel = {
      'streetname': '',
      'lat': this.selectedLatLng.lat,
      'lng': this.selectedLatLng.lng
    };
    this.getStreetName(this.selectedLatLng).then(streetName => {
      startPin.streetname = streetName;
      this.route.markers?.push(startPin);
      this.routeService.updateRoute(this.route);
    }).catch(error => {
      console.log("Error",error);
    });
    this.hideContextMenu();
  }

  setAsDestination() : void {
    console.log('Destination set in: ' + this.selectedLatLng);
    this.getNearestRoad(this.selectedLatLng.lat,this.selectedLatLng.lng).then(nearestLatLng => {
      this.commute.userDestinationLat = nearestLatLng.lat;
      this.commute.userDestinationLng = nearestLatLng.lng;
    });
  }

  setAsStartingPoint() : void {
    console.log('Starting Point set to : ' + this.selectedLatLng);
  }

  private onMarkerDragEnd(marker : L.Marker, oldLat: number, oldLng: number){
    const newLat = marker.getLatLng().lat;
    const newLng = marker.getLatLng().lng;
    this.getNearestRoad(newLat,newLng).then(latlng => {
      this.getStreetName(latlng).then(newStreetName => {
        //get the marker in router service that has the old latlng value then set its new new streetname, lat and lng to the nearest road
        let m = this.route.markers?.find(m => m.lat === oldLat && m.lng === oldLng);
        if(m){
          m.streetname = newStreetName;
          m.lat = latlng.lat;
          m.lng = latlng.lng;
        }

        //get the marker in markerMapping that also has the old latlng value then set its lat and lng to the nearest road
        const oldKey = `${oldLat},${oldLng}`;
        const newKey = `${newLat},${newLng}`;
        let p = this.markerMapping.get(oldKey);
        if(p){
          this.markerMapping.delete(oldKey);
          this.markerMapping.set(newKey,marker);
        }

        //update the route in router service
        this.routeService.updateRoute(this.route);
      });
    })
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

    // removeButton.addEventListener('click',() => {
    //   this.route.markers = this.route.markers?.filter(data => data.mapMarker !== marker);
    //   this.routeService.updateRoute(this.route);
    //   this.map.removeLayer(marker);
    //   this.map.closePopup();
    // })
  
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

  centerOnUserLocation(addPin : boolean) : void {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            this.commute.userLocationLat = userLat;
            this.commute.userLocationLng = userLng;

            // Center the map on the user's location
            this.map.setView([userLat, userLng], 18);

            if(addPin){
              console.log('Add Pin');
              L.marker([userLat,userLng],{
                icon: L.icon({
                  iconUrl: 'assets/icons/circle-dot-regular-blue.svg',
                  iconSize: [24,24],
                  iconAnchor: [12,12]
                })
              }).addTo(this.map);
            }else{
              console.log("Don't add Pin");
            }
        }, error => {
            console.error('Geolocation error:', error);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

}
