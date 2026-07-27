import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

// Icon keys map to minimalist line SVGs rendered in the template.

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  readonly nav: NavItem[] = [
    { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: 'shipments', label: 'Guías', icon: 'package' },
    { path: 'upload', label: 'Subir guía', icon: 'upload' },
    { path: 'customers', label: 'Clientes', icon: 'users' },
    { path: 'suppliers', label: 'Proveedores', icon: 'truck' },
    { path: 'employees', label: 'Empleados', icon: 'badge', adminOnly: true },
  ];

  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
