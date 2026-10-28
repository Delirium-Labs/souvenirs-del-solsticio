// Datos de ejemplo de la demo. Los precios de la lista nueva son de referencia (ver README): edítalos en el globo.
import { DAY } from './rules.js';

export function seed() {
  const hace = (n) => new Date(Date.now() - n * DAY).toISOString();
  const d = (id, nombre, precio, categoria, prioridad, modelo, color, dias) => ({ id, nombre, precio, categoria, prioridad, modelo, color, creado: hace(dias) });
  return {
    version: 2,
    demoDias: 0,
    ahorro: { monto: 505, actualizado: hace(3), historial: [{ fecha: hace(3), monto: 505 }] },
    deseos: [
      d('gixxer', 'Suzuki Gixxer SF 150 ABS', 3300, 'Moto', 'Alta', 'moto', '#2f5bd3', 92),
      d('lavadora', 'Lavadora Whirlpool 20 kg', 458.99, 'Casa', 'Alta', 'lavadora', '#e9edf2', 97),
      d('iphone16', 'iPhone 16', 699, 'Tecnología', 'Alta', 'celular', '#1f2026', 0),
      d('a7iv', 'Sony a7 IV', 1999.99, 'Imagen y cámara', 'Media', 'camara', '#1f2026', 0),
      d('pocket4', 'DJI Osmo Pocket 4', 599, 'Imagen y cámara', 'Media', 'gimbal', '#2b2d33', 0),
      d('bmw528', 'BMW 528i xDrive 2016', 7736, 'Carro', 'Baja', 'sedan', '#eef1f6', 0),
      d('r15', 'Yamaha R15', 4500, 'Moto', 'Media', 'moto', '#1e3fa8', 0),
      d('wrxsti', 'Subaru Impreza WRX STI (2001–2003)', 18500, 'Carro', 'Baja', 'deportivo', '#16161c', 0),
      d('zephyrus', 'ASUS ROG Zephyrus G16', 3000, 'Tecnología', 'Media', 'laptop', '#2a2c34', 0),
    ],
    compras: [],
    logros: {},
  };
}
