import React, { useEffect, useState } from 'react';
import { Plus, Car, Trash2, Edit2 } from 'lucide-react';
import { useFleetStore } from '../../store/useFleetStore';
import { RentalCar, RentalCarStatus } from '../../types';

export const FleetManagementOverview: React.FC = () => {
  const { cars, isLoading, fetchCars, deleteCar } = useFleetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Möchten Sie diesen Mietwagen wirklich löschen?')) {
      await deleteCar(id);
    }
  };

  const getStatusBadge = (status: RentalCarStatus) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Verfügbar</span>;
      case 'in_use':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Im Einsatz</span>;
      case 'maintenance':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Wartung</span>;
      case 'retired':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Ausgemustert</span>;
      default:
        return null;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Lade Mietwagen...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Car className="text-blue-500" />
            Flottenmanagement
          </h1>
          <p className="text-gray-400 text-sm mt-1">Verwalten Sie Ihre Mietwagen und deren Verfügbarkeit</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Mietwagen hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((car) => (
          <div key={car.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-all group relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors">
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(car.id)}
                className="p-1.5 bg-red-900/50 hover:bg-red-800/80 rounded-lg text-red-300 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white">{car.name}</h3>
                {getStatusBadge(car.status)}
              </div>
              <div className="inline-block mt-2 px-3 py-1 bg-gray-900/80 rounded-md border border-gray-700/50 font-mono text-sm text-gray-300">
                {car.license_plate}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between border-b border-gray-700/30 pb-1">
                <span>Klasse</span>
                <span className="text-gray-200">{car.vehicle_class || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700/30 pb-1">
                <span>Türen</span>
                <span className="text-gray-200">{car.doors || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700/30 pb-1">
                <span>Getriebe</span>
                <span className="text-gray-200 capitalize">{car.transmission || '-'}</span>
              </div>
            </div>
          </div>
        ))}

        {cars.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-800/20 border border-gray-700/30 rounded-xl border-dashed">
            <Car size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-1">Keine Mietwagen vorhanden</h3>
            <p className="text-gray-500">Fügen Sie Ihren ersten Mietwagen hinzu, um zu beginnen.</p>
          </div>
        )}
      </div>
    </div>
  );
};
