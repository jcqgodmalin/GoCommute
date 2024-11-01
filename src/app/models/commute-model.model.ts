import { RouteModel } from "./route-model.model";

export interface CommuteModel {
    userLocationLat : number,
    userLocationLng : number,
    userLocationStreetName : string,
    userDestinationLat : number,
    userDestinationLng : number,
    userDestinationStreetName : string,
    recommendRoutes : RouteModel[]
}
