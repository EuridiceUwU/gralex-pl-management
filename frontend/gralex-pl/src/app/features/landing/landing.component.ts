import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Carrier {
  name: string;
  theirPrice: number;
  color: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  readonly carriers: Carrier[] = [
    { name: 'DHL', theirPrice: 320, color: '#FFCC00' },
    { name: 'FedEx', theirPrice: 298, color: '#4D148C' },
    { name: 'Estafeta', theirPrice: 275, color: '#EE3124' },
  ];

  readonly steps = [
    { n: 1, title: 'Cotiza', text: 'Ingresa origen, destino y peso para ver tu precio al instante.' },
    { n: 2, title: 'Genera tu guía', text: 'Elige la paquetería y descarga tu guía lista para imprimir.' },
    { n: 3, title: 'Envía y ahorra', text: 'Entrega tu paquete y paga mucho menos que en mostrador.' },
  ];

  readonly benefits = [
    { icon: '💸', title: 'Hasta 60% de ahorro', text: 'Tarifas preferenciales con las mejores paqueterías.' },
    { icon: '⚡', title: 'Guías al instante', text: 'Genera y descarga en segundos, sin filas ni trámites.' },
    { icon: '🛡️', title: 'Envíos confiables', text: 'La misma cobertura y seguridad de las grandes marcas.' },
    { icon: '📊', title: 'Todo en un panel', text: 'Controla guías, clientes y gastos desde un solo lugar.' },
  ];

  readonly testimonials = [
    { name: 'María L.', role: 'Tienda en línea', text: 'Bajé mis costos de envío casi a la mitad. El proceso es rapidísimo.' },
    { name: 'Carlos R.', role: 'Distribuidor', text: 'Genero decenas de guías al día sin complicaciones. Excelente servicio.' },
    { name: 'Ana G.', role: 'Emprendedora', text: 'Por fin precios justos para envíos. Mis clientes reciben a tiempo.' },
  ];

  // --- Interactive quote calculator ---
  readonly weight = signal(3);
  readonly distance = signal<'local' | 'nacional'>('nacional');

  readonly gralexPrice = computed(() => {
    const base = this.distance() === 'local' ? 65 : 95;
    return Math.round(base + this.weight() * 18);
  });

  readonly marketPrice = computed(() => Math.round(this.gralexPrice() * 2.1));
  readonly savings = computed(() => this.marketPrice() - this.gralexPrice());
  readonly savingsPct = computed(() =>
    Math.round((this.savings() / this.marketPrice()) * 100),
  );

  setWeight(value: string): void {
    this.weight.set(Number(value));
  }
}
