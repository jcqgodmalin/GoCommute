import { Routes } from '@angular/router';
import { AddRoutesComponent } from './add-routes/add-routes.component';
import { FindRoutesComponent } from './find-routes/find-routes.component';

export const routes: Routes = [
    {path: '', redirectTo: '/findroutes', pathMatch: 'full'},
    {path: 'addroutes', component: AddRoutesComponent},
    {path: 'findroutes', component: FindRoutesComponent}
];
