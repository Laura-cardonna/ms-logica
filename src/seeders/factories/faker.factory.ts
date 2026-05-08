/**
 * Faker Factory - Utilidades para generar datos fake realistas
 */

export class FakerFactory {
  static random(max: number, min = 0): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Nombres
  static firstNames = [
    'Juan', 'María', 'Carlos', 'Ana', 'Roberto', 'Patricia', 'Luis', 'Sandra',
    'Miguel', 'Laura', 'Antonio', 'Sofía', 'Francisco', 'Elena', 'José',
    'Irene', 'Manuel', 'Beatriz', 'Pedro', 'Rosa',
  ];

  static lastNames = [
    'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Fernández',
    'Pérez', 'Sánchez', 'Díaz', 'Ramírez', 'Torres', 'Flores', 'Rivera',
    'Gómez', 'Vargas', 'Moreno', 'Castillo', 'Cortés', 'Medina', 'Ruiz',
  ];

  static cities = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Santa Marta', 'Cúcuta', 'Bucaramanga', 'Manizales', 'Pereira',
    'Quibdó', 'Ibagué', 'Villavicencio', 'Armenia', 'Tunja',
  ];

  static streets = [
    'Carrera', 'Calle', 'Diagonal', 'Avenida', 'Transversal', 'Cra', 'Cl',
  ];

  static routeNames = [
    'Ruta Centro-Norte', 'Ruta Centro-Sur', 'Ruta Este', 'Ruta Oeste',
    'Ruta Industrial', 'Ruta Residencial', 'Ruta Airport', 'Ruta Terminal',
    'Ruta Parque', 'Ruta Mercado', 'Ruta Universidad', 'Ruta Hospital',
  ];

  static stopsNames = [
    'Paradero Central', 'Paradero Universidad', 'Paradero Hospital',
    'Paradero Mercado', 'Paradero Terminal', 'Paradero Parque',
    'Paradero Centro Comercial', 'Paradero Estación', 'Paradero Colegio',
    'Paradero Biblioteca', 'Paradero Iglesia', 'Paradero Farmacia',
  ];

  static messageTemplates = [
    'El bus #{busNumber} está llegando en {minutes} minutos',
    'Ruta {routeName}: Retraso de {minutes} minutos',
    'Bienvenido a {cityName}. Próxima parada: {stopName}',
    'Manténgase seguro y use cinturón de seguridad',
    'Aviso de mantenimiento en ruta {routeName}',
    'Congestión en {stopName}, se espera demora de {minutes} minutos',
    'Asiento reservado para personas con movilidad reducida',
    'Reporta cualquier incidente al {phoneNumber}',
  ];

  static departments = [
    'Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Atlántico',
    'Bolívar', 'Cauca', 'Cesar', 'Córdoba', 'Huila', 'Magdalena',
    'Nariño', 'Norte de Santander', 'Quindío', 'Risaralda', 'Santander',
    'Sucre', 'Tolima', 'Meta', 'Caquetá', 'Guavare',
  ];

  // Utilidades de nombres
  static fullName(): string {
    return `${this.randomElement(this.firstNames)} ${this.randomElement(this.lastNames)}`;
  }

  static firstName(): string {
    return this.randomElement(this.firstNames);
  }

  static lastName(): string {
    return this.randomElement(this.lastNames);
  }

  // Contacto
  static email(): string {
    const name = this.firstName().toLowerCase();
    const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
    return `${name}.${this.random(9999)}@${this.randomElement(domains)}`;
  }

  static phoneNumber(): string {
    return `+57${this.random(9999999, 1000000)}`;
  }

  static cellPhone(): string {
    const prefix = ['301', '302', '303', '304', '305', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319'];
    return `+57${this.randomElement(prefix)}${this.random(9999999, 1000000)}`;
  }

  // Identificación
  static cedula(): string {
    // Formato: 8 dígitos
    return String(this.random(99999999, 10000000));
  }

  // Ubicación
  static city(): string {
    return this.randomElement(this.cities);
  }

  static department(): string {
    return this.randomElement(this.departments);
  }

  static street(): string {
    const streetType = this.randomElement(this.streets);
    const number = this.random(999, 1);
    const letter = String.fromCharCode(65 + this.random(26, 0));
    return `${streetType} ${number}${letter}`;
  }

  static postalCode(): string {
    return String(this.random(999999, 100000));
  }

  static address(): string {
    return `${this.street()} # ${this.random(99, 1)}-${this.random(999, 1)}`;
  }

  static apartment(): string | undefined {
    if (this.random(100) > 50) {
      return `Apt ${this.random(1000, 100)}`;
    }
    return undefined;
  }

  // Ubicación geográfica (Bogotá como centro)
  static latitude(): number {
    // Área metropolitana de Bogotá: 4.5-4.8
    return parseFloat((this.random(48, 45) / 10).toFixed(8));
  }

  static longitude(): number {
    // Área metropolitana de Bogotá: -74.3 a -74.0
    return parseFloat((-(this.random(740, 743) / 10)).toFixed(8));
  }

  static coordinates() {
    return {
      latitude: this.latitude(),
      longitude: this.longitude(),
    };
  }

  // Rutas
  static routeName(): string {
    return this.randomElement(this.routeNames);
  }

  static stopName(): string {
    return this.randomElement(this.stopsNames);
  }

  // Fechas
  static date(daysAgo = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() - this.random(daysAgo, 0));
    return date;
  }

  static dateOfBirth(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - this.random(80, 18));
    return date;
  }

  static futureDate(daysAhead = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.random(daysAhead, 1));
    return date;
  }

  // Números
  static price(min = 2000, max = 15000): number {
    return this.random(max, min);
  }

  static tariff(): number {
    return this.random(5000, 2000);
  }

  static duration(): number {
    // Duración en minutos
    return this.random(120, 15);
  }

  static percentage(): number {
    return this.random(100, 0);
  }

  // Estados
  static status(): string {
    return this.randomElement(['activa', 'inactiva']);
  }

  static state(): string {
    return this.randomElement(['activo', 'inactivo', 'pendiente', 'cancelado']);
  }

  // Mensajes
  static message(): string {
    return this.randomElement(this.messageTemplates);
  }

  // Descripciones
  static description(): string {
    const templates = [
      'Ruta con {stops} paradas, {duration} minutos aproximadamente',
      'Servicio de transporte público en {city}',
      'Conecta las zonas de {zone1} y {zone2}',
      'Disponible de 5:00 AM a 11:00 PM',
      'Tarifa especial para estudiantes y pensionados',
    ];
    return this.randomElement(templates);
  }

  // Utilidad general
  static randomId(): number {
    return this.random(999999999, 1);
  }

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
