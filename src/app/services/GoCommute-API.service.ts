import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { RouteModel } from "../models/route.model";
import { firstValueFrom, map, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class GoCommuteAPI{
    
    constructor(private httpClient : HttpClient){}

    private baseUrl = "http://localhost:5097/api/v1";
    private secretKey = "pGm6KLXhDBSESzAJdeXVDtUpWIrRlN1n";
    private appId = "b8074706-8f26-44ec-ac94-49db960d3b7e";

    //generate-token
    private async generateToken() : Promise<string> {
        const appKeys = {
            "appId": this.appId,
            "secretKey": this.secretKey
        };

        const data : any = await firstValueFrom(this.httpClient.post(`${this.baseUrl}/apps/token/generate`,appKeys));
        return data.accessToken;
    }

    public async getRoutes() : Promise<RouteModel[]> {
        var token = await this.generateToken();
        console.log(`${token}`);
        const headers = new HttpHeaders({
            "Authorization" : `Bearer ${token}`
        });

        const routes = await firstValueFrom(this.httpClient.get<RouteModel[]>(`${this.baseUrl}/route`,{headers}).pipe(
            map((routes : RouteModel[]) => {
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

}