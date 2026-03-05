// SpecificationsTable Component
// Displays car specifications in a clean table layout

import { formatPrice, formatMileage } from '@/lib/utils/format';

interface Car {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: string;
  transmission: string;
  fuel_type: string;
  body_type: string;
  color: string;
  vin?: string;
  engine_size?: string;
  doors?: number;
  seats?: number;
}

interface SpecificationsTableProps {
  car: Car;
}

export function SpecificationsTable({ car }: SpecificationsTableProps) {
  const specs = [
    { label: 'Make', value: car.make },
    { label: 'Model', value: car.model },
    { label: 'Year', value: car.year.toString() },
    { label: 'Price', value: formatPrice(car.price) },
    { label: 'Mileage', value: formatMileage(car.mileage) },
    { label: 'Condition', value: car.condition.charAt(0).toUpperCase() + car.condition.slice(1) },
    { label: 'Transmission', value: car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1) },
    { label: 'Fuel Type', value: car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1) },
    { label: 'Body Type', value: car.body_type.charAt(0).toUpperCase() + car.body_type.slice(1) },
    { label: 'Color', value: car.color.charAt(0).toUpperCase() + car.color.slice(1) },
  ];

  // Add optional specs if available
  if (car.vin) {
    specs.push({ label: 'VIN', value: car.vin });
  }
  if (car.engine_size) {
    specs.push({ label: 'Engine Size', value: car.engine_size });
  }
  if (car.doors) {
    specs.push({ label: 'Doors', value: car.doors.toString() });
  }
  if (car.seats) {
    specs.push({ label: 'Seats', value: car.seats.toString() });
  }

  return (
    <div className="bg-white border border-[#E1E1E1] rounded-[16px] overflow-hidden">
      <div className="divide-y divide-[#E1E1E1]">
        {specs.map((spec, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-4 px-6 py-4 hover:bg-[#F9FBFC] transition-colors"
          >
            <div className="text-[15px] leading-[26px] text-gray-600 font-medium">
              {spec.label}
            </div>
            <div className="text-[15px] leading-[26px] text-primary font-medium">
              {spec.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
