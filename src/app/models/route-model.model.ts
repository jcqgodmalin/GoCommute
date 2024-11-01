import { LatLngExpression } from "leaflet";
import { MarkerModel } from "./marker-model.model";

export interface RouteModel {
    vehicleType: string;
    busName?: string;
    routeNumber?: string;
    markers?: MarkerModel[];
    latlngs?: LatLngExpression[];
    isReset?: boolean;
}