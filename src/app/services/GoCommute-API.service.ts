import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { RouteModelNew } from "../models/route.model";
import { firstValueFrom, map, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class GoCommuteAPI{
    
    constructor(private httpClient : HttpClient){}

    private baseUrl = "http://localhost:5097/api/v1";
    private secretKey = "fwMYNJEjnbUeZa2qZvIU2YqerdFMMQ0y";
    private appId = "c18b4adc-fc82-40e6-9d35-f2c90e9c5fa0";

    //generate-token
    private async generateToken() : Promise<string> {
        const appKeys = {
            "appId": this.appId,
            "secretKey": this.secretKey
        };

        const data : any = await firstValueFrom(this.httpClient.post(`${this.baseUrl}/apps/token/generate`,appKeys));
        return data.accessToken;
    }

    private async generateHeader() : Promise<HttpHeaders> {
        var token = await this.generateToken();
        return new HttpHeaders({
            "Authorization" : `Bearer ${token}`
        });
    }

    public async getRoutes() : Promise<RouteModelNew[]> {
        var headers = await this.generateHeader();

        const routes = await firstValueFrom(this.httpClient.get<RouteModelNew[]>(`${this.baseUrl}/route`,{headers}).pipe(
            map((routes : RouteModelNew[]) => {
                console.log(routes);
                return routes.map(route => {
                    route.id = route.id;
                    route.vehicleType = route.vehicleType;
                    route.busName = route.busName;
                    route.routeNumber = route.routeNumber;
                    route.verified = route.verified;
                    route.routeTravelTimeInSeconds = route.routeTravelTimeInSeconds;
                    route.created_By = route.created_By;
                    route.updated_By = route.updated_By;
                    route.created_At = route.created_At;
                    route.updated_At = route.updated_At;
                    route.markers = route.markers.map(marker => {
                        marker.id = marker.id;
                        marker.routeId = marker.routeId;
                        marker.order = marker.order;
                        marker.streetName = marker.streetName;
                        marker.latitude = marker.latitude;
                        marker.longitude = marker.longitude;
                        return marker;
                    });
                    route.routePoints = route.routePoints.map(routePoint => {
                        routePoint.id = routePoint.id;
                        routePoint.routeId = routePoint.routeId;
                        routePoint.order = routePoint.order;
                        routePoint.latitude = routePoint.latitude;
                        routePoint.longitude = routePoint.longitude;
                        return routePoint;
                    });
                    return route;
                })
            })
        ));

        return routes;
        
    }

    // public async getRoutesThatPassesBy(latitude : number, longitude : number) : Promise<RouteModel[]> {}

    // public async getRouteById() : Promise<RouteModel> {}

    // public async getRouteByRouteNumber() : Promise<RouteModel>{}

    // public async getRouteByBusName() : Promise<RouteModel> {}

    public async saveRoute(route : RouteModelNew) : Promise<void> {
        try{
            console.log(route);
            var headers = await this.generateHeader();
            const res = await firstValueFrom(this.httpClient.post(`${this.baseUrl}/route`,route,{headers}));
            console.log(res);
        }  catch (error : any){
            console.log(error);
        }
        
    }
}