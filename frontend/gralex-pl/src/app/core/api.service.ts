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
  SupplierWithBalance,
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

  updateShipment(id: number, payload: unknown): Observable<unknown> {
    return this.http.put(`${API_BASE}/shipments/${id}`, payload);
  }

  assignShipments(
    shipmentIds: number[],
    target: { customerId?: number | null; supplierId?: number | null },
  ): Observable<unknown> {
    return this.http.patch(`${API_BASE}/shipments/assign`, { shipmentIds, ...target });
  }

  // Customers
  customers(): Observable<{ customers: Customer[] }> {
    return this.http.get<{ customers: Customer[] }>(`${API_BASE}/customers`);
  }

  createCustomer(payload: unknown): Observable<unknown> {
    return this.http.post(`${API_BASE}/customers`, payload);
  }

  // Suppliers
  suppliers(): Observable<{ suppliers: SupplierWithBalance[] }> {
    return this.http.get<{ suppliers: SupplierWithBalance[] }>(`${API_BASE}/suppliers`);
  }

  getSupplier(id: number): Observable<{ supplier: SupplierWithBalance }> {
    return this.http.get<{ supplier: SupplierWithBalance }>(`${API_BASE}/suppliers/${id}`);
  }

  createSupplier(payload: unknown): Observable<unknown> {
    return this.http.post(`${API_BASE}/suppliers`, payload);
  }

  updateSupplier(id: number, payload: unknown): Observable<unknown> {
    return this.http.put(`${API_BASE}/suppliers/${id}`, payload);
  }

  deleteSupplier(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/suppliers/${id}`);
  }

  supplierShipments(id: number): Observable<{ shipments: Shipment[] }> {
    return this.http.get<{ shipments: Shipment[] }>(`${API_BASE}/suppliers/${id}/shipments`);
  }

  updateShipmentStatus(id: number, ssId: number): Observable<unknown> {
    return this.http.patch(`${API_BASE}/shipments/${id}/status`, { ssId });
  }

  removeShipmentSupplier(id: number): Observable<unknown> {
    return this.http.patch(`${API_BASE}/shipments/${id}/remove-supplier`, {});
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

  confirmShipmentFromGuide(form: FormData): Observable<unknown> {
    return this.http.post(`${API_BASE}/documents/confirm-shipment`, form);
  }
}
