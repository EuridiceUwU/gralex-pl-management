import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE } from './api.config';
import {
  Customer,
  DashboardResponse,
  Employee,
  OcrResult,
  Shipment,
  Supplier,
} from './models';

/**
 * Thin wrapper over the backend REST API. Each method maps to one endpoint.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  // Dashboard
  dashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${API_BASE}/dashboard/metrics`);
  }

  // Shipments
  shipments(): Observable<{ shipments: Shipment[] }> {
    return this.http.get<{ shipments: Shipment[] }>(`${API_BASE}/shipments`);
  }

  shipmentStatuses(): Observable<{ statuses: { ss_id: number; ss_name: string }[] }> {
    return this.http.get<{ statuses: { ss_id: number; ss_name: string }[] }>(
      `${API_BASE}/shipments/statuses`,
    );
  }

  createShipment(payload: unknown): Observable<unknown> {
    return this.http.post(`${API_BASE}/shipments`, payload);
  }

  // Customers
  customers(): Observable<{ customers: Customer[] }> {
    return this.http.get<{ customers: Customer[] }>(`${API_BASE}/customers`);
  }

  createCustomer(payload: unknown): Observable<unknown> {
    return this.http.post(`${API_BASE}/customers`, payload);
  }

  // Suppliers
  suppliers(): Observable<{ suppliers: Supplier[] }> {
    return this.http.get<{ suppliers: Supplier[] }>(`${API_BASE}/suppliers`);
  }

  createSupplier(payload: unknown): Observable<unknown> {
    return this.http.post(`${API_BASE}/suppliers`, payload);
  }

  // Employees
  employees(): Observable<{ employees: Employee[] }> {
    return this.http.get<{ employees: Employee[] }>(`${API_BASE}/employees`);
  }

  roles(): Observable<{ roles: { role_id: number; role_name: string }[] }> {
    return this.http.get<{ roles: { role_id: number; role_name: string }[] }>(
      `${API_BASE}/roles`,
    );
  }

  createEmployee(payload: unknown): Observable<unknown> {
    return this.http.post(`${API_BASE}/employees`, payload);
  }

  // Documents / OCR
  uploadDocument(form: FormData): Observable<unknown> {
    return this.http.post(`${API_BASE}/documents/upload`, form);
  }

  runOcr(form: FormData): Observable<OcrResult> {
    return this.http.post<OcrResult>(`${API_BASE}/documents/ocr`, form);
  }
}
