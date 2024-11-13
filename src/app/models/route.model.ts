export interface RouteModel {
    id: number,
    vehicleType: string,
    busName: string,
    routeNumber: string,
    verified: boolean,
    markers: MarkerModel[],
    routePoints: RoutePointModel[],
    routeTravelTimeInSeconds: number,
    created_By: string,
    updated_By: string,
    created_At: Date,
    updated_At: Date
}

export interface MarkerModel {
    id: number,
    routeId: number,
    order: number,
    streetName: string,
    latitude: number,
    longitude: number
}

export interface RoutePointModel {
    id: number,
    routeId: number,
    order: number,
    latitude: number,
    longitude: number
}