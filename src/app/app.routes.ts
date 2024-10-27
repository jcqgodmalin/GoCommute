import { Routes } from '@angular/router';
import { AddRoutesComponent } from './add-routes/add-routes.component';

export const routes: Routes = [
    {path: '', component: AddRoutesComponent},
    {path: 'addroutes', component: AddRoutesComponent}
];
