export interface RouteModel {
    vehicleType: string;
    busName?: string;
    routeNumber?: string;
    startingpoint?: L.LatLng;
    startingpointStr?: string;
    straight_turning_markers?: any[];
    endpoint?: L.LatLng;
    endpointStr?: string;
}
