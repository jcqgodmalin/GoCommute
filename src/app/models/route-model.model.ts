import { LatLngExpression } from "leaflet";

export interface RouteModel {
    vehicleType: string;
    busName?: string;
    routeNumber?: string;
    markers?: any[];
    polyline: any;
    isReset: boolean;
}