import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'shipments',
        loadComponent: () =>
          import('./features/admin/shipments/shipments.component').then(
            (m) => m.ShipmentsComponent,
          ),
      },
      {
        path: 'upload',
        loadComponent: () =>
          import('./features/admin/upload-guide/upload-guide.component').then(
            (m) => m.UploadGuideComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/admin/customers/customers.component').then(
            (m) => m.CustomersComponent,
          ),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/admin/suppliers/suppliers.component').then(
            (m) => m.SuppliersComponent,
          ),
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/admin/employees/employees.component').then(
            (m) => m.EmployeesComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
