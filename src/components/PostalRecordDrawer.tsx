'use client';

import React, { useEffect } from 'react';
import type { UniversalPostalRecord, CountryConfig } from '../config/countries/types';

interface PostalRecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: UniversalPostalRecord | null;
  country: CountryConfig;
}

export function PostalRecordDrawer({ isOpen, onClose, record, country }: PostalRecordDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const raw = record.rawRecord || {};

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{country.flag}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Full Postal Record
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {country.name} · {record.postalCode}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close record drawer"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
            
            {/* Primary Identification Card */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-1">
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Primary Postal Unit
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {record.primaryName}
              </div>
              {record.secondaryName && (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {record.secondaryName}
                </div>
              )}
            </div>

            {/* Korean Road-Name Address System (도로명주소) & Jibun Address (지번주소) */}
            {(raw.roadAddress || raw.jibunAddress) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Road & Lot Address (도로명 및 지번)</span>
                  <span className="text-[10px] font-normal text-slate-400">Official Standards</span>
                </h4>
                {raw.roadAddress && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      도로명주소: {raw.roadAddress.fullAddressKo}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Road: {raw.roadAddress.fullAddressEn}
                    </div>
                    {raw.roadAddress.buildingManagementNumber && (
                      <div className="text-[10px] font-mono text-slate-400 pt-1">
                        Building Mgmt No: {raw.roadAddress.buildingManagementNumber}
                      </div>
                    )}
                  </div>
                )}
                {raw.jibunAddress && (
                  <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                    <div className="text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 font-medium">지번주소 (Lot):</span> {raw.jibunAddress.jibunKo}
                    </div>
                    <div className="text-slate-500">
                      <span className="text-slate-400">Legal Dong:</span> {raw.jibunAddress.legalDong} ({raw.jibunAddress.legalDongKo}) · <span className="text-slate-400">Admin Dong:</span> {raw.jibunAddress.adminDong} ({raw.jibunAddress.adminDongKo})
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* United States Postal Service Details (USPS AIS & Census Crosswalk) */}
            {(country.id === 'US' || raw.postalCityNames || raw.militaryOffice) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>USPS & Census Intelligence</span>
                  <span className="text-[10px] font-normal text-slate-400">Official USPS Standards</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {raw.postalCityNames && raw.postalCityNames.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-medium">USPS Postal Cities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {raw.postalCityNames.map((cityObj: any) => (
                          <span
                            key={cityObj.name}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              cityObj.status === 'Primary'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {cityObj.name} ({cityObj.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {raw.counties && raw.counties.length > 0 && (
                    <div className="pt-1 text-[11px]">
                      <span className="text-slate-400 font-medium">Associated Counties (FIPS):</span>
                      <div className="text-slate-700 dark:text-slate-200 mt-0.5">
                        {raw.counties.map((c: any) => `${c.name} [FIPS: ${c.fipsCode}]`).join(' · ')}
                      </div>
                    </div>
                  )}

                  {raw.militaryOffice && (
                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] space-y-0.5">
                      <div className="font-bold text-amber-800 dark:text-amber-300">
                        🎖️ Military Post Office ({raw.militaryOffice.code})
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        {raw.militaryOffice.baseName} · Gateway: {raw.militaryOffice.postalGateway}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400">Census ZCTA:</span>
                      <span className="font-mono font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.zcta ? raw.zcta.code : 'None (PO Box / Unique)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ZIP Classification:</span>
                      <span className="font-semibold ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.zipType || 'STANDARD'}
                      </span>
                    </div>
                  </div>

                  {raw.deliveryInfo && (
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      Routes: {raw.deliveryInfo.carrierRoutes} · Delivery Points: {raw.deliveryInfo.deliveryPoints.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* United Kingdom Intelligence (ONS & Royal Mail) */}
            {(country.id === 'GB' || raw.isBFPO || raw.isCrownDependency) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Royal Mail & ONS Intelligence</span>
                  <span className="text-[10px] font-normal text-slate-400">UK Official Standards</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {raw.isBFPO && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] space-y-1">
                      <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span>🎖️ British Forces Post Office ({raw.bfpoNumber})</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        Location: {raw.countryOrLocation || 'Military Base / Deployable Unit'}
                      </div>
                      {raw.shippingWarning && (
                        <div className="text-amber-700 dark:text-amber-400 font-medium">
                          ⚠️ {raw.shippingWarning}
                        </div>
                      )}
                    </div>
                  )}

                  {raw.isCrownDependency && (
                    <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] space-y-0.5">
                      <div className="font-bold text-blue-800 dark:text-blue-300">
                        👑 Crown Dependency ({raw.crownDependencyName})
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        Self-governing British Crown territory. Not part of the United Kingdom constituent countries.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Post Town:</span>
                      <span className="font-bold ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.postTown || record.city}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Local Authority:</span>
                      <span className="font-medium ml-1.5 text-slate-800 dark:text-slate-200 truncate inline-block max-w-[120px] align-bottom">
                        {raw.localAuthority || record.districtCounty || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Postcode Area:</span>
                      <span className="font-mono font-bold ml-1.5 text-indigo-600 dark:text-indigo-400">
                        {raw.postcodeComponents?.postcodeArea || record.postalCode.split(' ')[0]}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="font-semibold ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.isLargeUserPostcode ? 'Large User' : raw.isPoBox ? 'PO Box' : raw.isBFPO ? 'BFPO Military' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  {raw.selectedAddress && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-400 font-medium">Selected Premises:</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {raw.selectedAddress.fullAddressText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Japan Post & Administrative Intelligence (日本郵便 & 総務省) */}
            {(country.id === 'JP' || raw.prefectureCode || raw.postalCodeType) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Japan Post & Administrative Intelligence</span>
                  <span className="text-[10px] font-normal text-slate-400">日本郵便 規格</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {raw.postalCodeType === 'BUSINESS' ? (
                    <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-[11px] space-y-1">
                      <div className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                        <span>🏢 Large-User Business Postal Code (大口事業所個別番号)</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 font-semibold text-xs">
                        {raw.businessNameJa} ({raw.businessNameKana})
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {raw.businessName}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 pt-0.5">
                        📍 {raw.addressLineJa} ({raw.addressLineEn})
                      </div>
                      {raw.poBoxNumber && (
                        <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                          PO Box: {raw.poBoxNumber}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                            {raw.townArea?.nameJa} ({raw.townArea?.nameKana})
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400">
                            {raw.administrativeType === 'To' ? '都 (To)' : raw.administrativeType === 'Do' ? '道 (Do)' : raw.administrativeType === 'Fu' ? '府 (Fu)' : '県 (Ken)'}
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                          Romaji / English: {raw.townArea?.nameRomaji || '—'} · {raw.townArea?.nameEn || '—'}
                        </div>
                        {raw.municipality?.jisCode && (
                          <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                            JIS Municipality Code: {raw.municipality.jisCode} (Prefecture: {raw.prefectureCode})
                          </div>
                        )}
                      </div>

                      {/* Official Japan Post Source Flags */}
                      {raw.flags && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Japan Post Delivery & Locality Flags:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                            <span className={`px-2 py-1 rounded border flex items-center gap-1 ${
                              raw.flags.hasChome
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}>
                              {raw.flags.hasChome ? '✓' : '—'} Chome Addressing (丁目有)
                            </span>
                            <span className={`px-2 py-1 rounded border flex items-center gap-1 ${
                              raw.flags.smallAreaNumbering
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}>
                              {raw.flags.smallAreaNumbering ? '⚠️' : '—'} Small Area Numbering (小字等)
                            </span>
                            <span className={`px-2 py-1 rounded border flex items-center gap-1 ${
                              raw.flags.multiplePostalCodesForTownArea
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}>
                              {raw.flags.multiplePostalCodesForTownArea ? '⚠️' : '—'} Multi-Code Town (複数番号)
                            </span>
                            <span className={`px-2 py-1 rounded border flex items-center gap-1 ${
                              raw.flags.postalCodeCoversMultipleTownAreas
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}>
                              {raw.flags.postalCodeCoversMultipleTownAreas ? 'ℹ️' : '—'} Multi-Town Code (一括番号)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400">Prefecture (都道府県):</span>
                      <span className="font-bold ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.prefectureNameJa || record.provinceState}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Municipality (市区町村):</span>
                      <span className="font-semibold ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.municipality?.nameJa || record.city}
                      </span>
                    </div>
                    {raw.municipality?.administrativeType && (
                      <div>
                        <span className="text-slate-400">Admin Type:</span>
                        <span className="font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                          {raw.municipality.administrativeType}
                        </span>
                      </div>
                    )}
                    {raw.municipality?.countyNameJa && (
                      <div>
                        <span className="text-slate-400">County (郡):</span>
                        <span className="font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                          {raw.municipality.countyNameJa}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Indonesian Administrative & Pos Indonesia Intelligence (BPS, Kemendagri & Pos Indonesia) */}
            {(country.id === 'ID' || raw.kabupatenKota || raw.village) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Indonesian Administrative Intelligence</span>
                  <span className="text-[10px] font-normal text-slate-400">Kemendagri & Pos Indonesia</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        {raw.village?.nameId || record.area}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400">
                        {raw.village?.administrativeType || 'Village / Kelurahan'}
                      </span>
                    </div>
                    {raw.locality?.nameId && (
                      <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                        Wilayah / Locality: {raw.locality.nameId} ({raw.locality.nameEn})
                      </div>
                    )}
                    {raw.rt && raw.rw && (
                      <div className="text-[10px] font-medium text-slate-500 pt-0.5">
                        Rukun Warga / Tetangga: RT {raw.rt} / RW {raw.rw}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Province (Provinsi):</span>
                      <span className="font-bold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.province?.nameId || record.provinceState}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">City / Regency:</span>
                      <span className="font-semibold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.kabupatenKota?.nameId || record.city}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Classification:</span>
                      <span className="font-semibold ml-1.5 text-indigo-600 dark:text-indigo-400">
                        {raw.kabupatenKota?.administrativeType || 'Regency / City'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">District (Kecamatan):</span>
                      <span className="font-medium ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.district?.nameId || record.talukSubDistrict || '—'}
                      </span>
                    </div>
                  </div>

                  {raw.province?.specialStatus && (
                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[10px] space-y-0.5">
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        🏛️ Special Status (Status Khusus):
                      </span>
                      <div className="text-slate-600 dark:text-slate-300">
                        {raw.province.specialStatus}
                      </div>
                    </div>
                  )}

                  {raw.postOffice && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <span className="text-slate-400 font-medium">Kantor Pos (PT Pos Indonesia):</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        📮 {raw.postOffice.nameId} ({raw.postOffice.deliveryStatus || 'Delivery Office'})
                      </div>
                      {raw.postOffice.phone && (
                        <div className="text-slate-500 font-mono text-[10px]">
                          Telp: {raw.postOffice.phone}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Malaysian Administrative & Poskod Intelligence (MCMC, DOSM & Pos Malaysia) */}
            {(country.id === 'MY' || raw.administrativeArea?.code?.startsWith('MY-')) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Malaysian Administrative Intelligence</span>
                  <span className="text-[10px] font-normal text-slate-400">MCMC & DOSM Standards</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        {raw.city?.nameEn || record.city}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        raw.administrativeArea?.administrativeType === 'Federal Territory'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {raw.administrativeArea?.administrativeType === 'Federal Territory' ? 'Federal Territory' : 'State (Negeri)'}
                      </span>
                    </div>
                    {raw.locality?.nameMs && (
                      <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                        Kawasan / Locality: {raw.locality.nameMs}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">State / Territory:</span>
                      <span className="font-bold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.administrativeArea?.nameMs || record.provinceState}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ISO / DOSM Code:</span>
                      <span className="font-mono font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.administrativeArea?.code || '—'} [DOSM: {raw.administrativeArea?.codeDosm || '—'}]
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">
                        {raw.district?.administrativeType === 'Jajahan' ? 'Jajahan (Kelantan):' : 'District (Daerah):'}
                      </span>
                      <span className="font-semibold ml-1.5 text-indigo-600 dark:text-indigo-400 block truncate">
                        {raw.district?.nameMs || record.districtCounty}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mukim / Sub-District:</span>
                      <span className="font-medium ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.subDistrict?.nameMs || record.talukSubDistrict || '—'}
                      </span>
                    </div>
                  </div>

                  {raw.administrativeArea?.specialStatus && (
                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[10px] space-y-0.5">
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        🏛️ Special Administrative Status:
                      </span>
                      <div className="text-slate-600 dark:text-slate-300">
                        {raw.administrativeArea.specialStatus}
                      </div>
                    </div>
                  )}

                  {raw.postOffice && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <span className="text-slate-400 font-medium">Pejabat Pos / Pos Malaysia:</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        📮 {raw.postOffice.nameMs} ({raw.postOffice.deliveryStatus || 'Active Delivery Zone'})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sri Lankan Administrative & Postal Intelligence (Sri Lanka Post & DCS Standards) */}
            {(country.id === 'LK' || raw.postalTown || raw.dsDivision) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Sri Lankan Administrative Intelligence</span>
                  <span className="text-[10px] font-normal text-slate-400">Sri Lanka Post & DCS</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        {raw.postalTown?.nameEn || record.city}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400">
                        Postal Town (තැපැල් නගරය)
                      </span>
                    </div>
                    {(raw.postalTown?.nameSi || raw.postalTown?.nameTa) && (
                      <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {raw.postalTown.nameSi && <span>{raw.postalTown.nameSi}</span>}
                        {raw.postalTown.nameSi && raw.postalTown.nameTa && <span> · </span>}
                        {raw.postalTown.nameTa && <span>{raw.postalTown.nameTa}</span>}
                      </div>
                    )}
                    {raw.locality?.nameEn && raw.locality.nameEn !== raw.postalTown?.nameEn && (
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] pt-0.5">
                        Locality: {raw.locality.nameEn}
                        {raw.locality.nameSi ? ` (${raw.locality.nameSi})` : ''}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Province (පළාත):</span>
                      <span className="font-bold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.province?.nameEn || record.provinceState}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">District (දිස්ත්‍රික්කය):</span>
                      <span className="font-semibold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.district?.nameEn || record.districtCounty}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Admin Code:</span>
                      <span className="font-mono font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.district?.code || raw.province?.code || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">DS Division:</span>
                      <span className="font-medium ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.dsDivision?.nameEn || record.talukSubDistrict || 'DCS Statistical Zone'}
                      </span>
                    </div>
                  </div>

                  {raw.postOffice && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <span className="text-slate-400 font-medium">Department of Posts (Sri Lanka Post):</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        📮 {raw.postOffice.nameEn} ({raw.postOffice.type || 'Sub-Post Office'})
                      </div>
                      {(raw.postOffice.nameSi || raw.postOffice.nameTa) && (
                        <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                          {raw.postOffice.nameSi || ''} {raw.postOffice.nameTa ? `· ${raw.postOffice.nameTa}` : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {raw.coordinates?.latitude && raw.coordinates?.longitude && (
                    <div className="pt-1 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span>📍 Coordinates:</span>
                      <span>{raw.coordinates.latitude.toFixed(4)}° N, {raw.coordinates.longitude.toFixed(4)}° E</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vietnamese Administrative & 2025 Reform Intelligence (Decision 2334/QĐ-BKHCN) */}
            {(country.id === 'VN' || raw.commune || raw.provinceRegion) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Vietnamese 2-Tier Administrative Model</span>
                  <span className="text-[10px] font-normal text-slate-400">Effective 1 July 2025</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        {raw.commune?.fullNameVi || record.primaryName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        raw.commune?.administrativeType === 'Special Administrative Zone'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {raw.commune?.administrativeType || 'Commune Level'}
                      </span>
                    </div>
                    {raw.commune?.fullNameEn && (
                      <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                        English: {raw.commune.fullNameEn}
                      </div>
                    )}
                    {raw.postalObject && raw.postalObject.type !== 'Ward' && raw.postalObject.type !== 'Commune' && raw.postalObject.type !== 'Special Administrative Zone' && (
                      <div className="text-slate-500 dark:text-slate-400 text-[10px] pt-0.5">
                        Assigned Object: {raw.postalObject.type} ({raw.postalObject.nameVi})
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Province / City:</span>
                      <span className="font-bold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.provinceRegion?.fullNameVi || record.provinceState}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="font-semibold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.provinceRegion?.administrativeType || 'Province'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Province Code:</span>
                      <span className="font-mono font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.provinceRegion?.officialCode || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Commune Code:</span>
                      <span className="font-mono font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.commune?.officialCode || '—'}
                      </span>
                    </div>
                  </div>

                  {raw.legacyAdministrativeData && (
                    <div className="p-2 rounded bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[10px] space-y-0.5">
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        🏛️ Pre-2025 Historical District (Quận / Huyện Cũ):
                      </span>
                      <div className="text-slate-600 dark:text-slate-300">
                        {raw.legacyAdministrativeData.districtFullName} (Mã: {raw.legacyAdministrativeData.districtCode}) · Thuộc: {raw.legacyAdministrativeData.legacyProvinceName || raw.provinceRegion?.nameVi}
                      </div>
                      <div className="text-slate-400 italic">
                        * Note: District level eliminated effective 1 July 2025 under two-level local government model. Preserved strictly for ERP historical address migration.
                      </div>
                    </div>
                  )}

                  {raw.postOffice && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <span className="text-slate-400 font-medium">Vietnam Post (VNPost):</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        📮 {raw.postOffice.nameVi}
                      </div>
                      {raw.postOffice.address && (
                        <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                          Địa chỉ: {raw.postOffice.address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Canadian Postal & Statistics Canada Intelligence (Canada Post & SGC 2021) */}
            {(country.id === 'CA' || raw.provinceTerritory) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/60 pb-1.5 flex items-center justify-between">
                  <span>Canada Post & SGC Intelligence</span>
                  <span className="text-[10px] font-normal text-slate-400">Official Standards</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {raw.delivery?.deliveryContext === 'Military' && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] space-y-1">
                      <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span>🎖️ Canadian Forces Postal Service (CFPO / Military Mail)</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        {raw.postOffice?.nameEn || 'Canadian Forces Base / Department of National Defence'}
                      </div>
                    </div>
                  )}

                  {raw.delivery?.isLargeVolumeReceiver && (
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] space-y-0.5">
                      <div className="font-bold text-blue-800 dark:text-blue-300">
                        🏛️ Large Volume Receiver (LVR) / Institutional Mail
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-[10px]">
                        Dedicated high-volume sortation point (e.g. Government, Crown Corp, Major Corporate Facility)
                      </div>
                    </div>
                  )}

                  {raw.delivery?.postalBox?.isPostalBox && (
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-[11px] space-y-0.5">
                      <div className="font-bold text-purple-800 dark:text-purple-300">
                        📬 Postal Box Lockbox Facility (Case Postale)
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-[10px]">
                        Station: {raw.delivery.postalBox.station} · Range: {raw.delivery.postalBox.boxNumber}
                      </div>
                    </div>
                  )}

                  {raw.delivery?.ruralRoute?.isRuralRoute && (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] space-y-0.5">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300">
                        🚜 Rural Route Delivery (Route Rurale)
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-[10px]">
                        Route: {raw.delivery.ruralRoute.routeIdentifier} · Station: {raw.delivery.ruralRoute.station}
                      </div>
                    </div>
                  )}

                  {raw.delivery?.generalDelivery?.isGeneralDelivery && (
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] space-y-0.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        📯 General Delivery (Poste Restante)
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-[10px]">
                        Station: {raw.delivery.generalDelivery.station}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">FSA (Forward Sortation):</span>
                      <span className="font-mono font-bold ml-1.5 text-indigo-600 dark:text-indigo-400">
                        {raw.fsa || record.postalCode?.slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">LDU (Delivery Unit):</span>
                      <span className="font-mono font-semibold ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.ldu || record.postalCode?.slice(4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Province / Territory:</span>
                      <span className="font-bold ml-1.5 text-slate-800 dark:text-slate-200 block truncate">
                        {raw.provinceTerritory?.nameEn || record.provinceState}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Nom en Français:</span>
                      <span className="font-medium ml-1.5 text-slate-700 dark:text-slate-300 block truncate">
                        {raw.provinceTerritory?.nameFr || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">SGC Code:</span>
                      <span className="font-mono font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.provinceTerritory?.sgcCode || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ISO 3166-2:</span>
                      <span className="font-mono font-medium ml-1.5 text-slate-800 dark:text-slate-200">
                        {raw.provinceTerritory?.isoCode || '—'}
                      </span>
                    </div>
                  </div>

                  {(raw.officialGeography?.censusDivision || raw.officialGeography?.censusSubdivision) && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                      <div className="text-slate-400 font-medium">Statistics Canada SGC Geography:</div>
                      {raw.officialGeography.censusDivision && (
                        <div className="text-slate-700 dark:text-slate-300 text-[10px]">
                          <span className="font-semibold">Census Division:</span> {raw.officialGeography.censusDivision.name} (Code: {raw.officialGeography.censusDivision.code} · {raw.officialGeography.censusDivision.type})
                        </div>
                      )}
                      {raw.officialGeography.censusSubdivision && (
                        <div className="text-slate-700 dark:text-slate-300 text-[10px]">
                          <span className="font-semibold">Census Subdivision:</span> {raw.officialGeography.censusSubdivision.name} (Code: {raw.officialGeography.censusSubdivision.code} · {raw.officialGeography.censusSubdivision.type})
                        </div>
                      )}
                    </div>
                  )}

                  {raw.postOffice && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <span className="text-slate-400 font-medium">Post Office / Postal Station:</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        📮 {raw.postOffice.nameEn}
                      </div>
                      {raw.postOffice.nameFr && raw.postOffice.nameFr !== raw.postOffice.nameEn && (
                        <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                          {raw.postOffice.nameFr}
                        </div>
                      )}
                      {raw.postOffice.station && (
                        <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                          Station: {raw.postOffice.station} · Type: {raw.postOffice.type}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 1: Postal Information */}
            <div className="space-y-3">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                Postal Information
              </h4>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">{country.postalCode.label}</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {record.postalCode}
                  </dd>
                </div>
                {record.deliveryStatus && (
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Delivery Status</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                      {record.deliveryStatus}
                    </dd>
                  </div>
                )}
                {record.officeType && (
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Office Type</dt>
                    <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                      {record.officeType}
                    </dd>
                  </div>
                )}
                {record.administrativeType && (
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Classification</dt>
                    <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                      {record.administrativeType}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Section 2: Administrative Hierarchy */}
            <div className="space-y-3">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                Administrative Hierarchy
              </h4>
              <dl className="space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <dt className="text-slate-500 dark:text-slate-400">Country</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">{record.country}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {country.id === 'IN'
                      ? 'State / Union Territory'
                      : country.id === 'KR'
                      ? 'Province / Metropolitan Area (시·도)'
                      : country.id === 'EG'
                      ? 'Governorate (محافظة)'
                      : country.id === 'US'
                      ? 'State / District / Territory'
                      : country.id === 'GB'
                      ? 'Constituent Country'
                      : country.id === 'JP'
                      ? 'Prefecture (都道府県)'
                      : country.id === 'ID'
                      ? 'Province (Provinsi)'
                      : 'Province / Region'}
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">{record.provinceState}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {country.id === 'KR'
                      ? 'City / County (시·군·구)'
                      : country.id === 'US'
                      ? 'City / Postal City'
                      : country.id === 'GB'
                      ? 'Post Town (Royal Mail)'
                      : country.id === 'JP'
                      ? 'City / Municipality (市区町村)'
                      : country.id === 'ID'
                      ? 'City / Regency (Kota / Kabupaten)'
                      : 'City / Town'}
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">{record.city}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {country.id === 'IN'
                      ? 'District'
                      : country.id === 'KR'
                      ? 'District (구·군)'
                      : country.id === 'EG'
                      ? 'District (قسم / مركز)'
                      : country.id === 'US'
                      ? 'County / Parish / Municipio'
                      : country.id === 'GB'
                      ? 'District / Local Authority'
                      : country.id === 'JP'
                      ? 'Ward / County (区 / 郡)'
                      : country.id === 'ID'
                      ? 'District (Kecamatan)'
                      : 'Prefecture / County'}
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">{record.districtCounty}</dd>
                </div>
                {record.talukSubDistrict && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <dt className="text-slate-500 dark:text-slate-400">
                      {country.id === 'KR'
                        ? 'Town / Dong (읍·면·동)'
                        : country.id === 'US'
                        ? 'Census ZCTA'
                        : country.id === 'JP'
                        ? 'JIS Municipality Code'
                        : country.id === 'ID'
                        ? 'Kecamatan (District)'
                        : 'Taluk / Sub-District'}
                    </dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">{record.talukSubDistrict}</dd>
                  </div>
                )}
                {record.area && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <dt className="text-slate-500 dark:text-slate-400">Locality / Area</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">{record.area}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Section 3: Geographic Coordinates — only show if both values are non-null numbers */}
            {(record.latitude != null && record.longitude != null) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Geographic Coordinates
                </h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Latitude</div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                      {record.latitude.toFixed(6)}° N
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Longitude</div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                      {record.longitude.toFixed(6)}° E
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Postal Network / Hierarchy Details */}
            {(raw.circle || raw.region || raw.division || raw.officeId || raw.relatedHeadOffice) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Postal Network
                </h4>
                <dl className="space-y-2">
                  {raw.circle && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">Postal Circle</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{raw.circle}</dd>
                    </div>
                  )}
                  {raw.region && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">Postal Region</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{raw.region}</dd>
                    </div>
                  )}
                  {raw.division && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">Division</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{raw.division}</dd>
                    </div>
                  )}
                  {raw.relatedHeadOffice && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">Head Office</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{raw.relatedHeadOffice}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Section 5: Contact Details */}
            {(record.phone || record.email) && (
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Contact Details
                </h4>
                <dl className="space-y-2">
                  {record.phone && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">Telephone</dt>
                      <dd className="font-mono text-slate-900 dark:text-white">📞 {record.phone}</dd>
                    </div>
                  )}
                  {record.email && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                      <dd className="font-mono text-slate-900 dark:text-white">✉ {record.email}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Section 6: Source & Validation Metadata */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                Dataset Attribution
              </h4>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {raw.source?.name || (country.id === 'IN' ? 'Department of Posts, Government of India' : 'Ministry of Civil Affairs & China Post')}
                </div>
                <div className="text-slate-400 font-mono">
                  Record ID: {raw.source?.recordId || record.id}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                  ✓ Verified 100% Offline Local Dataset
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
