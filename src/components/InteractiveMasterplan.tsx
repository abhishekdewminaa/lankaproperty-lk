import { useState } from 'react';
import { MasterplanUnit } from '../types/property';
import { formatPriceLkr } from '../utils/formatters';
import { Bed, Bath, Maximize2, Compass, Check, AlertCircle, Info } from 'lucide-react';

interface InteractiveMasterplanProps {
  units: MasterplanUnit[];
  viewBox?: string;
  onInquireUnit?: (unit: MasterplanUnit) => void;
}

export function InteractiveMasterplan({
  units,
  viewBox = '0 0 900 520',
  onInquireUnit,
}: InteractiveMasterplanProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[2]?.id || units[0]?.id);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  const filteredUnits = units.filter((u) => {
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
  });

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) return '#103D2C'; // Selected strong deep green
    if (status === 'available') return '#176B45'; // Primary green
    if (status === 'reserved') return '#D97706'; // Muted amber
    return '#9EABA2'; // Sold grey
  };

  const getStatusFill = (status: string, isSelected: boolean) => {
    if (isSelected) return 'rgba(16, 61, 44, 0.22)';
    if (status === 'available') return 'rgba(23, 107, 69, 0.12)';
    if (status === 'reserved') return 'rgba(217, 119, 6, 0.08)';
    return 'rgba(158, 170, 162, 0.15)';
  };

  return (
    <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 lg:p-8 space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DDE5DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#176B45]">
              Interactive Site Map
            </span>
            <span className="text-xs text-[#5F6B63]">(Demonstration Scheme)</span>
          </div>
          <h3 className="text-xl font-bold text-[#18251E] mt-1">
            Talpe Bay Masterplan & Plot Availability
          </h3>
          <p className="text-xs text-[#5F6B63] mt-1">
            Click any villa plot below or choose from the unit register to review detailed specifications.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs font-semibold overflow-x-auto">
          {(['all', 'available', 'reserved', 'sold'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-[2px] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#176B45] ${
                statusFilter === filter
                  ? 'bg-white text-[#103D2C] shadow-xs font-bold'
                  : 'text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              {filter === 'all'
                ? 'All Plots (12)'
                : filter === 'available'
                ? 'Available (6)'
                : filter === 'reserved'
                ? 'Reserved (3)'
                : 'Sold (3)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SVG Plan Canvas */}
        <div className="lg:col-span-8 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] p-4 relative overflow-hidden">
          {/* Subtle architectural compass marker */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-[#5F6B63] bg-white/90 px-2.5 py-1 rounded-[2px] border border-[#DDE5DF] shadow-xs">
            <Compass className="w-3.5 h-3.5 text-[#176B45]" />
            <span>North / Indian Ocean Shoreline</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={viewBox}
              className="w-full min-w-[580px] h-auto drop-shadow-xs select-none"
              aria-label="Talpe Bay Site Map"
            >
              {/* Site Base Background & Ocean Boundary */}
              <rect x="10" y="10" width="880" height="500" rx="4" fill="#FFFFFF" stroke="#DDE5DF" strokeWidth="1.5" />
              <path d="M 10 40 Q 450 15 890 40 L 890 10 L 10 10 Z" fill="#E8F3EC" stroke="#176B45" strokeWidth="1" />
              <text x="450" y="30" textAnchor="middle" fill="#176B45" fontSize="11" fontWeight="bold" letterSpacing="2">
                INDIAN OCEAN SHORELINE & PRIVATE BEACHFRONT ACCESS
              </text>

              {/* Central Green Lawn & Pool */}
              <rect x="250" y="320" width="400" height="20" rx="2" fill="#E8F3EC" />
              <text x="450" y="334" textAnchor="middle" fill="#176B45" fontSize="9" fontWeight="600" letterSpacing="1">
                CENTRAL FRANGIPANI LAWN & WATER PAVILION
              </text>

              {/* Internal Walkway Paths */}
              <line x1="60" y1="190" x2="850" y2="190" stroke="#DDE5DF" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="60" y1="330" x2="850" y2="330" stroke="#DDE5DF" strokeWidth="2" strokeDasharray="4 4" />

              {/* Masterplan Units Polygons */}
              {units.map((unit) => {
                const isSelected = unit.id === selectedUnit?.id;
                const matchesFilter = statusFilter === 'all' || unit.status === statusFilter;
                const strokeColor = getStatusColor(unit.status, isSelected);
                const fillColor = getStatusFill(unit.status, isSelected);

                return (
                  <g
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className="cursor-pointer transition-all duration-200"
                    role="button"
                    tabIndex={0}
                    aria-label={`${unit.code} - ${unit.title} (${unit.status})`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedUnitId(unit.id);
                      }
                    }}
                  >
                    <path
                      d={unit.svgPath}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      opacity={matchesFilter ? 1 : 0.3}
                      className="transition-colors hover:brightness-95"
                    />

                    {/* Unit Code Label */}
                    <text
                      x={unit.labelPosition.x}
                      y={unit.labelPosition.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected ? '#103D2C' : strokeColor}
                      fontSize="12"
                      fontWeight={isSelected ? '800' : '700'}
                      opacity={matchesFilter ? 1 : 0.3}
                      className="pointer-events-none"
                    >
                      {unit.code}
                    </text>

                    {/* Unit Status Micro Subtext */}
                    <text
                      x={unit.labelPosition.x}
                      y={unit.labelPosition.y + 16}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#5F6B63"
                      fontSize="9"
                      fontWeight="600"
                      opacity={matchesFilter ? 1 : 0.3}
                      className="pointer-events-none uppercase"
                    >
                      {unit.status}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Masterplan Status Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-[#DDE5DF] text-xs">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="flex items-center gap-1.5 font-semibold text-[#18251E]">
                <span className="w-3.5 h-3.5 bg-[#E8F3EC] border border-[#176B45] rounded-[2px]" />
                Available for Purchase
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#18251E]">
                <span className="w-3.5 h-3.5 bg-[#FEF3C7] border border-[#D97706] rounded-[2px]" />
                Reserved / Under Contract
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#18251E]">
                <span className="w-3.5 h-3.5 bg-[#E2E8F0] border border-[#9EABA2] rounded-[2px]" />
                Sold
              </span>
            </div>

            <p className="text-[11px] text-[#5F6B63] italic">
              * Illustrative plot scheme. Not a surveyed boundary plan.
            </p>
          </div>
        </div>

        {/* Selected Unit Detail Inspector Drawer (Desktop right / Mobile bottom) */}
        <div className="lg:col-span-4 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] p-6 space-y-5">
          {selectedUnit ? (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-[#DDE5DF]">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#176B45]">
                    {selectedUnit.code}
                  </span>
                  <span
                    className={`text-xs uppercase font-bold px-2 py-0.5 rounded-[2px] ${
                      selectedUnit.status === 'available'
                        ? 'bg-[#E8F3EC] text-[#176B45]'
                        : selectedUnit.status === 'reserved'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {selectedUnit.status}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[#18251E]">{selectedUnit.title}</h4>
                <p className="text-xs text-[#5F6B63]">{selectedUnit.type}</p>
              </div>

              {/* Price */}
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-[#5F6B63]">Starting Valuation</span>
                <p className="text-xl font-extrabold text-[#103D2C] tabular-nums">
                  {selectedUnit.priceLkr > 0
                    ? formatPriceLkr(selectedUnit.priceLkr, 'total')
                    : 'Estate Amenity Facility'}
                </p>
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                {selectedUnit.bedrooms !== undefined && (
                  <div className="p-2.5 bg-white border border-[#DDE5DF] rounded-[2px]">
                    <span className="text-[#5F6B63] block">Bedrooms</span>
                    <span className="text-sm font-bold text-[#18251E] flex items-center gap-1 mt-0.5">
                      <Bed className="w-3.5 h-3.5 text-[#176B45]" />
                      {selectedUnit.bedrooms} Suites
                    </span>
                  </div>
                )}

                {selectedUnit.bathrooms !== undefined && (
                  <div className="p-2.5 bg-white border border-[#DDE5DF] rounded-[2px]">
                    <span className="text-[#5F6B63] block">Bathrooms</span>
                    <span className="text-sm font-bold text-[#18251E] flex items-center gap-1 mt-0.5">
                      <Bath className="w-3.5 h-3.5 text-[#176B45]" />
                      {selectedUnit.bathrooms} Luxury Baths
                    </span>
                  </div>
                )}

                <div className="p-2.5 bg-white border border-[#DDE5DF] rounded-[2px]">
                  <span className="text-[#5F6B63] block">Floor Area</span>
                  <span className="text-sm font-bold text-[#18251E] flex items-center gap-1 mt-0.5">
                    <Maximize2 className="w-3.5 h-3.5 text-[#176B45]" />
                    {selectedUnit.floorAreaSqFt} sq ft
                  </span>
                </div>

                {selectedUnit.landPerches && (
                  <div className="p-2.5 bg-white border border-[#DDE5DF] rounded-[2px]">
                    <span className="text-[#5F6B63] block">Private Land</span>
                    <span className="text-sm font-bold text-[#18251E] block mt-0.5">
                      {selectedUnit.landPerches} perches
                    </span>
                  </div>
                )}
              </div>

              {/* Orientation / View */}
              <div className="p-3 bg-white border border-[#DDE5DF] rounded-[2px] text-xs">
                <span className="font-bold text-[#18251E] block">Orientation & Aspect:</span>
                <span className="text-[#5F6B63]">{selectedUnit.view}</span>
              </div>

              {/* CTA Action */}
              <div className="pt-2">
                {selectedUnit.status === 'available' ? (
                  <button
                    onClick={() => onInquireUnit && onInquireUnit(selectedUnit)}
                    className="w-full py-3 px-4 bg-[#176B45] hover:bg-[#115236] text-white font-bold text-sm rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45]"
                  >
                    Reserve or Inquire on {selectedUnit.code}
                  </button>
                ) : selectedUnit.status === 'reserved' ? (
                  <button
                    onClick={() => onInquireUnit && onInquireUnit(selectedUnit)}
                    className="w-full py-3 px-4 border border-[#176B45] text-[#176B45] hover:bg-[#E8F3EC] font-bold text-sm rounded-[3px] transition-colors"
                  >
                    Join Waitlist for {selectedUnit.code}
                  </button>
                ) : (
                  <div className="p-3 bg-neutral-200 text-neutral-700 text-center text-xs font-semibold rounded-[3px]">
                    This plot has been sold. Explore neighboring units.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[#5F6B63]">
              Select a plot on the masterplan to view unit details.
            </div>
          )}
        </div>
      </div>

      {/* Accessible Tabular Alternative for Keyboard / Screen Readers */}
      <div className="pt-4 border-t border-[#DDE5DF]">
        <details className="text-xs text-[#5F6B63] group">
          <summary className="font-bold uppercase tracking-wider text-[#18251E] cursor-pointer hover:text-[#176B45] py-2 flex items-center justify-between">
            <span>View Accessible Unit Registry Table ({filteredUnits.length} listings)</span>
            <span className="text-xs text-[#176B45] group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full border-collapse text-left border border-[#DDE5DF]">
              <thead>
                <tr className="bg-[#F5F8F5] text-[#18251E] border-b border-[#DDE5DF]">
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Villa Name</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Bed/Bath</th>
                  <th className="p-2.5">Floor Area</th>
                  <th className="p-2.5">Land Extent</th>
                  <th className="p-2.5">Price</th>
                  <th className="p-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b border-[#DDE5DF] hover:bg-[#F5F8F5] transition-colors ${
                      u.id === selectedUnit?.id ? 'bg-[#E8F3EC]/50 font-semibold' : ''
                    }`}
                  >
                    <td className="p-2.5 font-bold text-[#103D2C]">{u.code}</td>
                    <td className="p-2.5">{u.title}</td>
                    <td className="p-2.5 capitalize">{u.status}</td>
                    <td className="p-2.5">{u.bedrooms ? `${u.bedrooms}B / ${u.bathrooms}B` : 'Amenity'}</td>
                    <td className="p-2.5">{u.floorAreaSqFt} sq ft</td>
                    <td className="p-2.5">{u.landPerches ? `${u.landPerches} perches` : '—'}</td>
                    <td className="p-2.5 font-bold">{u.priceLkr > 0 ? formatPriceLkr(u.priceLkr, 'total') : 'Community'}</td>
                    <td className="p-2.5">
                      <button
                        onClick={() => setSelectedUnitId(u.id)}
                        className="text-[#176B45] hover:underline font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
