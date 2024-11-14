export interface RouteModelNew {
    id?: number,
    vehicleType: string,
    busName?: string,
    routeNumber?: string,
    verified: boolean,
    markers: MarkerModelNew[],
    routePoints: RoutePointModelNew[],
    routeTravelTimeInSeconds: number,
    created_By?: string,
    updated_By?: string,
    created_At?: Date,
    updated_At?: Date
}

export interface MarkerModelNew {
    id?: number,
    routeId?: number,
    order?: number,
    streetName: string,
    latitude: number,
    longitude: number
}

export interface RoutePointModelNew {
    id?: number,
    routeId?: number,
    order: number,
    latitude: number,
    longitude: number
}