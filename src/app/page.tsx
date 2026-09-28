'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CountrySelector } from '@/components/CountrySelector';
import { PostalRecordTable } from '@/components/PostalRecordTable';
import { PostalRecordDrawer } from '@/components/PostalRecordDrawer';
import { DatasetInfo } from '@/components/DatasetInfo';
import {
  type CountryConfig,
  type UniversalPostalRecord,
  type UniversalLookupResult,
  AVAILABLE_COUNTRIES,
  DEFAULT_COUNTRY,
} from '@/config/countries';

export default function SaaSPostalLookupPage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(DEFAULT_COUNTRY);
  const [postalCode, setPostalCode] = useState('');
  const [lookupResult, setLookupResult] = useState<UniversalLookupResult | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<UniversalPostalRecord | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [customAreaText, setCustomAreaText] = useState('');
  const [activeResultTab, setActiveResultTab] = useState<'cards' | 'table'>('cards');
  const [drawerRecord, setDrawerRecord] = useState<UniversalPostalRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User input address fields
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');

  // UI status feedback
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedPayload, setSavedPayload] = useState<any | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Execute lookup whenever postalCode reaches the required country length
  useEffect(() => {
    const cleaned = selectedCountry.postalCode.clean(postalCode);

    const isMatchLength =
      selectedCountry.id === 'US'
        ? (cleaned.length === 5 || cleaned.length === 10) && selectedCountry.postalCode.validate(cleaned)
        : selectedCountry.id === 'GB'
        ? cleaned.length >= 6 && cleaned.length <= 8 && selectedCountry.postalCode.validate(cleaned)
        : selectedCountry.id === 'CA'
        ? cleaned.replace(/\s+/g, '').length === 6 && selectedCountry.postalCode.validate(cleaned)
        : selectedCountry.id === 'JP'
        ? (cleaned.replace(/-/g, '').length === 7) && selectedCountry.postalCode.validate(cleaned)
        : cleaned.length === selectedCountry.postalCode.length && selectedCountry.postalCode.validate(cleaned);

    if (isMatchLength) {
      startTransition(async () => {
        const res = await selectedCountry.lookup(cleaned);
        setLookupResult(res);

        if (res.found && res.records.length > 0) {
          // Section 11: A postal code may contain multiple post offices.
          // NEVER automatically choose one when multiple records exist.
          if (res.records.length === 1) {
            const singleRec = res.records[0];
            setSelectedRecord(singleRec);
            const defaultArea = res.defaultArea || (res.areas && res.areas.length > 0 ? res.areas[0] : singleRec.area);
            setSelectedArea(defaultArea);
          } else {
            // Multiple records exist: wait for user selection
            setSelectedRecord(null);
            setSelectedArea('');
          }
          setIsCustomArea(false);
          setCustomAreaText('');
        } else {
          setSelectedRecord(null);
          setSelectedArea('');
          setIsCustomArea(false);
        }
      });
    } else {
      if (cleaned.length === 0) {
        setLookupResult(null);
        setSelectedRecord(null);
        setSelectedArea('');
        setIsCustomArea(false);
      }
    }
  }, [postalCode, selectedCountry]);

  // Handle country switching (Section 29)
  const handleCountrySwitch = (newCountry: CountryConfig) => {
    if (newCountry.id === selectedCountry.id) return;

    setSelectedCountry(newCountry);
    setPostalCode('');
    setLookupResult(null);
    setSelectedRecord(null);
    setSelectedArea('');
    setIsCustomArea(false);
    setCustomAreaText('');
    setCopied(false);
    setSavedSuccess(false);
    setSavedPayload(null);
  };

  const handleRecordSelect = (rec: UniversalPostalRecord) => {
    setSelectedRecord(rec);
    if (!isCustomArea) {
      setSelectedArea(rec.area);
    }
  };

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setIsCustomArea(false);

    // If an office matches this area, sync selection
    if (lookupResult) {
      const match = lookupResult.records.find(
        (r) => r.area.toLowerCase() === area.toLowerCase() || r.primaryName.toLowerCase().includes(area.toLowerCase())
      );
      if (match) {
        setSelectedRecord(match);
      }
    }
  };

  const handlePresetClick = (code: string) => {
    setPostalCode(code);
  };

  const handleOpenDrawer = (rec: UniversalPostalRecord) => {
    setDrawerRecord(rec);
    setIsDrawerOpen(true);
  };

  const handleCopyFullAddress = () => {
    if (!selectedRecord) return;
    const fullText = selectedCountry.formatFullAddress(
      selectedRecord,
      postalCode,
      { addressLine1, addressLine2 },
      isCustomArea && customAreaText.trim() ? customAreaText.trim() : selectedArea
    );
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToErp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const areaToUse = isCustomArea && customAreaText.trim() ? customAreaText.trim() : selectedArea;

    // Structured ERP Payload
    const payload = {
      country: {
        name: selectedCountry.name,
        isoAlpha2: selectedCountry.isoAlpha2,
        isoAlpha3: selectedCountry.isoAlpha3,
        isoNumeric: selectedCountry.isoNumeric,
        phoneCode: selectedCountry.phoneCode,
      },
      postalCode,
      selectedRecordId: selectedRecord.id,
      premises: {
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
      },
      areaLocality: areaToUse,
      postalOffice: selectedRecord.primaryName,
      administrativeFields: {
        city: selectedRecord.city,
        districtCounty: selectedRecord.districtCounty,
        provinceState: selectedRecord.provinceState,
        talukSubDistrict: selectedRecord.talukSubDistrict || null,
        classification: selectedRecord.administrativeType || selectedRecord.officeType || null,
      },
      coordinates: {
        latitude: selectedRecord.latitude || null,
        longitude: selectedRecord.longitude || null,
      },
      formattedAddress: selectedCountry.formatFullAddress(
        selectedRecord,
        postalCode,
        { addressLine1, addressLine2 },
        areaToUse
      ),
      audit: {
        dataset: `${selectedCountry.name} Local Offline Directory`,
        timestamp: new Date().toISOString(),
        offlineVerified: true,
      },
    };

    setSavedPayload(payload);
    setSavedSuccess(true);
  };

  const handleResetRequest = () => {
    if (postalCode || addressLine1 || addressLine2 || selectedRecord) {
      setShowConfirmReset(true);
    } else {
      executeReset();
    }
  };

  const executeReset = () => {
    setPostalCode('');
    setLookupResult(null);
    setSelectedRecord(null);
    setSelectedArea('');
    setIsCustomArea(false);
    setCustomAreaText('');
    setAddressLine1('');
    setAddressLine2('');
    setCopied(false);
    setSavedSuccess(false);
    setSavedPayload(null);
    setShowConfirmReset(false);
  };

  // Helper to extract auto-fill value for dynamic field
  const getFieldValue = (fieldKey: string): string => {
    if (!selectedRecord) return '';
    const areaToUse = isCustomArea && customAreaText.trim() ? customAreaText.trim() : selectedArea || selectedRecord.area;

    switch (fieldKey) {
      case 'area':
      case 'locality':
        return selectedRecord.rawRecord?.roadAddress?.buildingName || areaToUse;
      case 'postOffice':
        return selectedRecord.primaryName;
      case 'city':
      case 'cityTown':
      case 'cityCounty':
      case 'cityRegency':
        return selectedRecord.city;
      case 'district':
      case 'prefectureCounty':
      case 'county':
        return selectedRecord.districtCounty;
      case 'subDistrict':
      case 'townDong':
      case 'talukSubDistrict':
        return selectedRecord.talukSubDistrict || 'â€”';
      case 'state':
      case 'stateUT':
      case 'provinceRegion':
      case 'province':
      case 'governorate':
      case 'provinceMetro':
      case 'stateDistrictTerritory':
        return selectedRecord.provinceState;
      case 'villageLocality':
        return areaToUse;
      case 'postOfficeArea':
        return selectedRecord.rawRecord?.postOffice?.nameId
          ? `${selectedRecord.rawRecord.postOffice.nameId} (${selectedRecord.rawRecord.locality?.nameId || ''})`
          : selectedRecord.secondaryName || selectedRecord.primaryName;
      case 'roadName':
        return selectedRecord.rawRecord?.roadAddress?.roadName
          ? `${selectedRecord.rawRecord.roadAddress.roadName} (${selectedRecord.rawRecord.roadAddress.roadNameKo || ''})`
          : '';
      case 'buildingNumber':
        return selectedRecord.rawRecord?.roadAddress?.buildingNumber || '';
      case 'zipPlus4':
        return selectedRecord.rawRecord?.zip4 || '';
      case 'constituentCountry':
        return selectedRecord.provinceState;
      case 'postTown':
      case 'postalTown':
        return selectedRecord.rawRecord?.postalTown?.nameEn || selectedRecord.city;
      case 'dsDivision':
        return selectedRecord.rawRecord?.dsDivision?.nameEn || selectedRecord.talukSubDistrict || 'â€”';
      case 'gnDivision':
        return selectedRecord.rawRecord?.gnDivision?.nameEn || 'â€”';
      case 'communeWard':
        return selectedRecord.rawRecord?.commune?.fullNameVi || selectedRecord.rawRecord?.commune?.nameVi || areaToUse;
      case 'postalArea':
        return selectedRecord.rawRecord?.postalObject?.nameVi || selectedRecord.primaryName;
      case 'legacyDistrict':
        return selectedRecord.rawRecord?.legacyAdministrativeData?.districtFullName
          ? `${selectedRecord.rawRecord.legacyAdministrativeData.districtFullName} [pre-2025]`
          : 'â€”';
      case 'districtLocalAuthority':
        return selectedRecord.districtCounty;
      case 'countyRegion':
        return selectedRecord.rawRecord?.ceremonialCounty || selectedRecord.rawRecord?.region || 'â€”';
      case 'buildingPremises':
        return selectedRecord.rawRecord?.selectedAddress?.buildingName || selectedRecord.rawRecord?.selectedAddress?.buildingNumber
          ? `${selectedRecord.rawRecord.selectedAddress.buildingName ? selectedRecord.rawRecord.selectedAddress.buildingName + ' ' : ''}${selectedRecord.rawRecord.selectedAddress.buildingNumber || ''}`.trim()
          : selectedRecord.primaryName;
      case 'prefecture':
        return selectedRecord.provinceState
          ? `${selectedRecord.provinceState}${selectedRecord.rawRecord?.prefectureNameEn ? ` (${selectedRecord.rawRecord.prefectureNameEn})` : ''}`
          : '';
      case 'cityMunicipality':
        return selectedRecord.city
          ? `${selectedRecord.city}${selectedRecord.rawRecord?.municipality?.nameEn ? ` (${selectedRecord.rawRecord.municipality.nameEn})` : ''}`
          : '';
      case 'wardCounty':
        return selectedRecord.districtCounty || 'â€”';
      case 'townArea':
        return areaToUse;
      case 'buildingApartment':
        if (selectedRecord.rawRecord?.postalCodeType === 'BUSINESS') {
          return `${selectedRecord.rawRecord.businessNameJa} (${selectedRecord.rawRecord.addressLineJa || ''})`;
        }
        return selectedRecord.rawRecord?.flags?.hasChome ? 'ä¸ç›®ãƒ»ç•ªåœ° (Chome/Banchi required)' : 'â€” (User Input)';
      case 'postalCode':
        return selectedCountry.id === 'JP' ? (selectedRecord.rawRecord?.postalCodeFormatted || selectedRecord.postalCode) : selectedRecord.postalCode;
      case 'country':
        return selectedCountry.name;
      default:
        return (selectedRecord as any)[fieldKey] || '';
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">

      {/* 1. SaaS Top Header */}
      <Header />

      {/* 2. Main Compact Workspace */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-2.5">

        {/* Compact Page Title Bar */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Postal Code Lookup
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Local · 0 External APIs
            </span>
          </div>
          <div className="text-[10px] text-slate-400 hidden md:block shrink-0">
            Find postal areas &amp; auto-populate address fields from local offline datasets
          </div>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[520px_1fr] gap-3">

          {/* LEFT COLUMN: Lookup + Results */}
          <div className="flex flex-col gap-2.5 min-h-0">

            {/* Lookup Control Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3">

              {/* Row 1: Country + Postal Code side by side */}
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[200px_1fr] gap-2 items-end">

                {/* Country Selector */}
                <div>
                  <CountrySelector
                    selectedCountry={selectedCountry}
                    onSelectCountry={handleCountrySwitch}
                  />
                </div>

                {/* Postal Code Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="postalCodeInput"
                      className="block text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate"
                    >
                      {selectedCountry.postalCode.label}
                    </label>
                    <span className="text-[9.5px] text-slate-400 font-mono shrink-0 ml-1">
                      {selectedCountry.id === 'US' ? '5 or 9 digits' : selectedCountry.id === 'GB' ? '6-8 chars' : selectedCountry.id === 'CA' ? 'ANA NAN' : selectedCountry.id === 'JP' ? '7 digits' : `${selectedCountry.postalCode.length} digits`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="postalCodeInput"
                      type="text"
                      maxLength={selectedCountry.id === 'US' ? 10 : (selectedCountry.id === 'GB' || selectedCountry.id === 'JP') ? 8 : selectedCountry.id === 'CA' ? 7 : selectedCountry.postalCode.length}
                      value={postalCode}
                      onChange={(e) => setPostalCode(selectedCountry.postalCode.clean(e.target.value))}
                      placeholder={selectedCountry.postalCode.placeholder}
                      className="w-full h-9 text-base font-mono tracking-widest px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                      autoFocus
                    />
                    {postalCode && (
                      <button
                        type="button"
                        onClick={() => setPostalCode('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Status indicator */}
              <div className="flex items-center justify-between text-[10.5px] mt-1.5 min-h-[16px]">
                <div>
                  {postalCode.length === 0 && (
                    <span className="text-slate-400">
                      {selectedCountry.id === 'GB'
                        ? 'e.g. SW1A 1AA, M1 1AE, B33 8TH'
                        : selectedCountry.id === 'CA'
                        ? 'e.g. K1A 0B1, M5V 3L9, H3B 2Y5'
                        : selectedCountry.id === 'JP'
                        ? 'e.g. 100-0001 or 1000001'
                        : selectedCountry.id === 'ID'
                        ? 'e.g. 40198 or 10110'
                        : selectedCountry.id === 'MY'
                        ? 'e.g. 43000, 50450, 01000'
                        : selectedCountry.id === 'LK'
                        ? 'e.g. 00100, 20000, 80000'
                        : selectedCountry.id === 'VN'
                        ? 'e.g. 10000, 70000, 01318'
                        : `Enter a ${selectedCountry.postalCode.length}-digit code to begin`}
                    </span>
                  )}
                  {postalCode.length > 0 && selectedCountry.id !== 'GB' && selectedCountry.id !== 'CA' && (selectedCountry.id === 'JP' ? postalCode.replace(/-/g, '').length < 7 : postalCode.length < selectedCountry.postalCode.length) && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {selectedCountry.id === 'JP' ? 7 - postalCode.replace(/-/g, '').length : selectedCountry.postalCode.length - postalCode.length} more digit{((selectedCountry.id === 'JP' ? 7 - postalCode.replace(/-/g, '').length : selectedCountry.postalCode.length - postalCode.length) > 1) ? 's' : ''} needed
                    </span>
                  )}
                  {postalCode.length > 0 && selectedCountry.id === 'CA' && postalCode.replace(/\s+/g, '').length < 6 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {6 - postalCode.replace(/\s+/g, '').length} more char{6 - postalCode.replace(/\s+/g, '').length > 1 ? 's' : ''} (ANA NAN)
                    </span>
                  )}
                  {lookupResult?.found && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      ✓ Verified — {lookupResult.records.length} {lookupResult.records.length === 1 ? 'area' : 'areas'} found
                    </span>
                  )}
                  {lookupResult && !lookupResult.found && (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      ✗ {lookupResult.error || 'Not found in local dataset'}
                    </span>
                  )}
                </div>
                {lookupResult?.found && (
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                    Local · {lookupResult.executionTimeMs}ms
                  </span>
                )}
              </div>

              {/* Row 3: Preset Chips */}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">
                    Presets:
                  </span>
                  {selectedCountry.presets.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handlePresetClick(p.code)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition flex items-center gap-1 ${
                        postalCode === p.code
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      <span className="font-mono font-bold">{p.code}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-normal hidden sm:inline">({p.label})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty State */}
            {(!lookupResult || postalCode.length === 0) && (
              <div className="p-5 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
                <div className="text-2xl mb-1.5">📮</div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                  Enter a postal code to begin
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Select a country and enter a valid postal code to find matching postal areas from local offline datasets.
                </p>
              </div>
            )}

            {/* Error State */}
            {lookupResult && !lookupResult.found && (
              <div className="p-3.5 text-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20">
                <div className="text-xl mb-1">⚠️</div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                  No postal record found
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mb-2">
                  {selectedCountry.name} dataset has no match. Check and try again.
                </p>
                <button
                  type="button"
                  onClick={() => setPostalCode('')}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition"
                >
                  Clear &amp; Try Another
                </button>
              </div>
            )}

            {/* Results Section */}
            {lookupResult && lookupResult.found && lookupResult.records.length > 0 && (
              <div className="flex flex-col gap-2">

                {/* Multiple-record prompt */}
                {lookupResult.records.length > 1 && !selectedRecord && (
                  <div className="px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10.5px] flex items-center gap-1.5">
                    <span>👉</span>
                    <span><strong>{lookupResult.records.length} areas found.</strong> Click to select your post office / area below.</span>
                  </div>
                )}

                {/* JP flags */}
                {selectedCountry.id === 'JP' && selectedRecord && (selectedRecord.rawRecord?.flags?.multiplePostalCodesForTownArea || selectedRecord.rawRecord?.flags?.smallAreaNumbering) && (
                  <div className="px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 text-[10.5px] flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <span>⚠️</span>
                    <span><strong>Additional address info required</strong> (Chome / Banchi / Koaza)</span>
                  </div>
                )}
                {selectedCountry.id === 'JP' && selectedRecord?.rawRecord?.postalCodeType === 'BUSINESS' && (
                  <div className="px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-[10.5px] space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-indigo-600 text-white uppercase tracking-wider">Business Code</span>
                      <span className="font-mono font-bold">{selectedRecord.postalCode}</span>
                    </div>
                    <div className="text-xs font-bold">{selectedRecord.rawRecord.businessNameJa} ({selectedRecord.rawRecord.businessName})</div>
                    <div className="text-slate-600 dark:text-slate-300">{selectedRecord.rawRecord.addressLineJa} ({selectedRecord.rawRecord.addressLineEn})</div>
                  </div>
                )}

                {/* Results Header with View Toggle */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10.5px] font-bold text-slate-900 dark:text-white">
                      📍 Select Postal Area / Post Office
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-mono bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                      {lookupResult.records.length}
                    </span>
                  </div>
                  <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('cards')}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition ${
                        activeResultTab === 'cards'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('table')}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition ${
                        activeResultTab === 'table'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>

                {/* Cards View */}
                {activeResultTab === 'cards' && (
                  <div className="max-h-40 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                    {lookupResult.records.map((r) => {
                      const isSelected = selectedRecord?.id === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => handleRecordSelect(r)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all relative ${
                            isSelected
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-semibold text-[11px] text-slate-900 dark:text-white truncate">
                              {r.area || r.primaryName}
                            </div>
                            {r.deliveryStatus && (
                              <span
                                className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded border shrink-0 ${
                                  r.deliveryStatus === 'Delivery'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                                }`}
                              >
                                {r.deliveryStatus}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {r.primaryName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {r.city}{r.districtCounty ? `, ${r.districtCounty}` : ''}
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">{r.postalCode}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleOpenDrawer(r); }}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Table View */}
                {activeResultTab === 'table' && (
                  <div className="max-h-40 overflow-hidden">
                    <PostalRecordTable
                      records={lookupResult.records}
                      selectedRecord={selectedRecord}
                      onSelectRecord={handleRecordSelect}
                      country={selectedCountry}
                      onViewRecordDetail={handleOpenDrawer}
                    />
                  </div>
                )}

                {/* Neighborhoods */}
                {lookupResult.areas && lookupResult.areas.length > 1 && (
                  <div className="px-3 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10.5px] font-bold text-slate-900 dark:text-white">
                        📍 Neighborhoods / Local Areas ({lookupResult.areas.length})
                      </span>
                      <span className="text-[9.5px] text-slate-500">Click to apply</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {lookupResult.areas.map((area) => {
                        const isAreaSelected = selectedArea === area && !isCustomArea;
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => handleAreaSelect(area)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition ${
                              isAreaSelected
                                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            {isAreaSelected ? '✓ ' : ''}{area}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setIsCustomArea(!isCustomArea)}
                        className="text-[10px] px-2 py-0.5 rounded-md border border-dashed border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-900"
                      >
                        {isCustomArea ? '← List' : '+ Custom'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Postal Area Summary */}
                {selectedRecord && (
                  <div className="px-3 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                        Selected Postal Area
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(selectedRecord)}
                        className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View Full Record →
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {isCustomArea && customAreaText.trim() ? customAreaText.trim() : (selectedArea || selectedRecord.area)}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{selectedRecord.primaryName}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                          <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {selectedRecord.postalCode}
                          </span>
                          {selectedRecord.deliveryStatus && (
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${
                              selectedRecord.deliveryStatus === 'Delivery'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                            }`}>
                              {selectedRecord.deliveryStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN: Address Form */}
          <div className="flex flex-col min-h-0">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-full">

              {/* Form Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Address</span>
                  {selectedRecord && (
                    <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                      Auto-Populated
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedRecord && (
                    <button
                      type="button"
                      onClick={handleCopyFullAddress}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
                    >
                      {copied ? '✓ Copied' : '📋 Copy Full Address'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetRequest}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveToErp} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3.5 py-2.5 space-y-2.5">

                  {/* SECTION A: Postal Information (Auto-Filled) â€” FIRST */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Postal Information
                      </span>
                      <span className="text-[9.5px] text-slate-400">
                        Auto-filled · {selectedCountry.name} local dataset
                        {isCustomArea && <span className="ml-1.5 text-indigo-500">· Custom colony</span>}
                      </span>
                    </div>

                    {/* Custom Colony input */}
                    {isCustomArea && (
                      <div className="mb-2 p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Custom Neighborhood / Colony Name
                        </label>
                        <input
                          type="text"
                          value={customAreaText}
                          onChange={(e) => setCustomAreaText(e.target.value)}
                          placeholder="Type custom colony, society, or apartment complex..."
                          className="w-full px-2.5 py-1.5 rounded-md text-[10.5px] bg-white dark:bg-slate-900 border border-indigo-400 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Dynamic Country-Specific Fields */}
                    <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                      {selectedCountry.fields.map((field) => {
                        const val = getFieldValue(field.key);
                        return (
                          <div key={field.key}>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[9.5px] font-semibold text-slate-600 dark:text-slate-400 truncate leading-tight">
                                {field.label}
                              </label>
                              {val && (
                                <span className="text-[8.5px] text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">✓</span>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                readOnly
                                value={val}
                                placeholder={field.placeholder}
                                className={`w-full h-7 px-2 rounded-md text-[10.5px] font-medium border transition-colors ${
                                  val
                                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white pr-5'
                                    : 'bg-slate-100/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-400 placeholder:text-[9.5px]'
                                }`}
                              />
                              {val && (
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 select-none">🔒</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION B: Address Line 1 & 2 â€” AT THE VERY END */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5">
                      Your Address <span className="text-[9.5px] text-slate-400 font-normal">(User Input)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="Flat / Office / Floor / Building Name"
                          className="w-full h-7 px-2 rounded-md text-[10.5px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          placeholder="Road / Street / Cross / Landmark"
                          className="w-full h-7 px-2 rounded-md text-[10.5px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </form>
            </div>
          </div>
          {/* END RIGHT COLUMN */}

        </div>
        {/* END 2-column grid */}

        {/* Dataset Info â€” below the grid */}
        <DatasetInfo />

      </main>

      {/* Compact Footer */}
      <Footer />

      {/* Drawer: Complete Full Record View */}
      <PostalRecordDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={drawerRecord}
        country={selectedCountry}
      />

      {/* Modal: ERP Save Success */}
      {savedSuccess && savedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Saved to ERP
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Postal record and address payload prepared for ERP ingestion.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSavedSuccess(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 custom-scrollbar">
              <pre>{JSON.stringify(savedPayload, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(savedPayload, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {copied ? '✓ JSON Copied' : '📋 Copy JSON Payload'}
              </button>
              <button
                type="button"
                onClick={() => setSavedSuccess(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Reset Postal Address Form?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This will clear your entered postal code and all autofilled address fields.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
