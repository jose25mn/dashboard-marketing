"use client";

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  Database, Save, ArrowLeft, FileSpreadsheet, Edit3, Trash2, 
  RefreshCcw, AlertCircle, ChevronRight, DollarSign, MousePointer, 
  Users, ShoppingBag, Globe, Facebook, Smartphone, Layers, PenTool
} from 'lucide-react';
import Link from 'next/link';

// --- CONFIGURAÇÕES ---
const MONTH_MAP: { [key: string]: string } = { "JANEIRO": "Jan", "FEVEREIRO": "Fev", "MARÇO": "Mar", "ABRIL": "Abr", "MAIO": "Mai", "JUNHO": "Jun", "JULHO": "Jul", "AGOSTO": "Ago", "SETEMBRO": "Set", "OUTUBRO": "Out", "NOVEMBRO": "Nov", "DEZEMBRO": "Dez" };
const METRIC_MAP: { [key: string]: string } = { 'Investimento ( mkt)': 'invest', 'Faturamento': 'faturamento', 'Leads (Contatos Recebidos) (mkt)': 'leads', 'Cliques (mkt)': 'cliques', 'Atendimentos (Conversas sem vácuo)': 'atendimentos', 'Agendamentos': 'agendamentos', 'Comparecimentos': 'comparecimentos', 'Pessoas que compraram': 'vendas' };

// Tipos
type Metrics = { invest: number; faturamento: number; cliques: number; leads: number; atendimentos: number; agendamentos: number; comparecimentos: number; vendas: number; roas: number; ticket: number; cpc: number; cpl: number; taxa_lead: number; taxa_atendimento: number; taxa_agendamento: number; taxa_comparecimento: number; taxa_venda: number; };
type RowData = { id: string; name: string; google: Metrics; facebook: Metrics; instagram: Metrics; total: Metrics; hasError?: boolean; };

const initialMetrics = (): Metrics => ({ invest: 0, faturamento: 0, cliques: 0, leads: 0, atendimentos: 0, agendamentos: 0, comparecimentos: 0, vendas: 0, roas: 0, ticket: 0, cpc: 0, cpl: 0, taxa_lead: 0, taxa_atendimento: 0, taxa_agendamento: 0, taxa_comparecimento: 0, taxa_venda: 0 });

const round = (num: number) => {
    if (!num || isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function AdminPage() {
  const [step, setStep] = useState<'upload' | 'editor'>('upload');
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'total' | 'google' | 'facebook' | 'instagram'>('total');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // --- CÁLCULOS ---
  const calculateRates = (m: Metrics): Metrics => ({
      ...m,
      invest: round(m.invest), faturamento: round(m.faturamento),
      roas: m.invest > 0 ? round(m.faturamento / m.invest) : 0,
      ticket: m.vendas > 0 ? round(m.faturamento / m.vendas) : 0,
      cpc: m.cliques > 0 ? round(m.invest / m.cliques) : 0,
      cpl: m.leads > 0 ? round(m.invest / m.leads) : 0,
      taxa_lead: m.cliques > 0 ? round((m.leads / m.cliques) * 100) : 0,
      taxa_atendimento: m.leads > 0 ? round((m.atendimentos / m.leads) * 100) : 0,
      taxa_agendamento: m.atendimentos > 0 ? round((m.agendamentos / m.atendimentos) * 100) : 0,
      taxa_comparecimento: m.agendamentos > 0 ? round((m.comparecimentos / m.agendamentos) * 100) : 0,
      taxa_venda: m.leads > 0 ? round((m.vendas / m.leads) * 100) : 0,
  });

  const recalculateRow = (row: RowData): RowData => {
    const google = calculateRates(row.google);
    const facebook = calculateRates(row.facebook);
    const instagram = calculateRates(row.instagram);
    const totalRaw: Metrics = {
      invest: google.invest + facebook.invest + instagram.invest,
      faturamento: google.faturamento + facebook.faturamento + instagram.faturamento,
      cliques: google.cliques + facebook.cliques + instagram.cliques,
      leads: google.leads + facebook.leads + instagram.leads,
      atendimentos: google.atendimentos + facebook.atendimentos + instagram.atendimentos,
      agendamentos: google.agendamentos + facebook.agendamentos + instagram.agendamentos,
      comparecimentos: google.comparecimentos + facebook.comparecimentos + instagram.comparecimentos,
      vendas: google.vendas + facebook.vendas + instagram.vendas,
      roas: 0, ticket: 0, cpc: 0, cpl: 0, taxa_lead: 0, taxa_atendimento: 0, taxa_agendamento: 0, taxa_comparecimento: 0, taxa_venda: 0
    };
    return { ...row, google, facebook, instagram, total: calculateRates(totalRaw) };
  };

  // --- CARREGAR DADOS EXISTENTES ---
  useEffect(() => {
    async function fetchExistingData() {
        try {
            const response = await fetch('/api/metrics');
            const data = await response.json();
            if (data && data.detailed && data.detailed.length > 0) {
                setTableData(data.detailed);
            } else { initializeEmptyTable(); }
        } catch (error) { initializeEmptyTable(); }
    }
    fetchExistingData();
  }, []);

  const initializeEmptyTable = () => {
    const months = Object.keys(MONTH_MAP);
    const emptyData = months.map(monthName => ({ id: MONTH_MAP[monthName], name: MONTH_MAP[monthName], google: initialMetrics(), facebook: initialMetrics(), instagram: initialMetrics(), total: initialMetrics() }));
    setTableData(emptyData);
  };

  // --- HANDLERS ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, { header: false, skipEmptyLines: true, complete: (results) => parseCSVToTable(results.data) });
  };

  const parseCSVToTable = (rawData: any[]) => {
    try {
      const months = Object.keys(MONTH_MAP);
      const newTableData: RowData[] = [];
      let startCol = 2; 

      months.forEach((monthName) => {
        if (!rawData[0] || startCol + 3 >= rawData[0].length) return;
        const monthShort = MONTH_MAP[monthName];
        let row: RowData = { id: monthShort, name: monthShort, google: initialMetrics(), facebook: initialMetrics(), instagram: initialMetrics(), total: initialMetrics() };

        for (let rowIdx = 3; rowIdx < rawData.length; rowIdx++) {
            if (!rawData[rowIdx] || !rawData[rowIdx][1]) continue;
            const metricRaw = String(rawData[rowIdx][1]).replace('\n', ' ').trim();
            let mappedKey: keyof Metrics | null = null;
            for (const key in METRIC_MAP) { if (metricRaw.includes(key)) { mappedKey = METRIC_MAP[key] as keyof Metrics; break; } }

            if (mappedKey) {
                const parseVal = (val: any) => {
                    const clean = String(val || 0).replace('R$', '').replace('%', '').trim().replace('.', '').replace(',', '.');
                    return parseFloat(clean) || 0;
                };
                row.facebook[mappedKey] = parseVal(rawData[rowIdx][startCol + 1]);
                row.instagram[mappedKey] = parseVal(rawData[rowIdx][startCol + 2]);
                row.google[mappedKey] = parseVal(rawData[rowIdx][startCol + 3]);
            }
        }
        newTableData.push(recalculateRow(row));
        startCol += 4;
      });
      setTableData(newTableData);
      setStep('editor'); 
    } catch (e) { alert("Erro ao ler CSV"); }
  };

  const handleChange = (platform: 'google' | 'facebook' | 'instagram', field: keyof Metrics, value: string) => {
    const newData = [...tableData];
    newData[selectedMonthIndex][platform][field] = parseFloat(value) || 0;
    newData[selectedMonthIndex] = recalculateRow(newData[selectedMonthIndex]);
    setTableData(newData);
  };

  const saveFinalData = async () => {
    setStatus('saving');
    try {
        const response = await fetch('/api/metrics', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ detailed: tableData })
        });
        if (response.ok) { setStatus('success'); setTimeout(() => { setStep('upload'); setStatus('idle'); }, 2000); }
    } catch (error) { setStatus('error'); }
  };

  const currentRow = tableData[selectedMonthIndex];
  
  // --- RENDERIZAÇÃO FORM ---
  const renderForm = (data: Metrics, platform: 'google' | 'facebook' | 'instagram' | 'total') => {
    const isReadOnly = platform === 'total'; 
    const handleChangeWrapper = (field: keyof Metrics, val: string) => { if (!isReadOnly) handleChange(platform, field, val); };

    const inputClass = isReadOnly 
        ? "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-500 font-bold outline-none cursor-not-allowed"
        : "w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm";
    
    const labelClass = "block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-wide";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            
            {/* 1. FINANCEIRO (AZUL) */}
            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xs font-bold text-blue-600 uppercase mb-4 flex items-center gap-2"><DollarSign size={16}/> Financeiro & Ads</h3>
                <div className="space-y-4">
                    <div><label className={labelClass}>Investimento Total</label><input type="number" step="0.01" disabled={isReadOnly} value={data.invest} onChange={(e)=>handleChangeWrapper('invest',e.target.value)} className={isReadOnly ? inputClass : "w-full bg-white border border-blue-300 rounded-lg px-4 py-3 text-blue-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10"}/></div>
                    <div><label className={labelClass}>Faturamento</label><input type="number" step="0.01" disabled={isReadOnly} value={data.faturamento} onChange={(e)=>handleChangeWrapper('faturamento',e.target.value)} className={inputClass}/></div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl"><span className="block text-[10px] font-bold text-blue-400 uppercase mb-1">ROAS</span><span className="text-xl font-bold text-blue-900">{data.roas}x</span></div>
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl"><span className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Ticket Médio</span><span className="text-xl font-bold text-blue-900">R$ {data.ticket}</span></div>
                    </div>
                </div>
            </div>

            {/* 2. TRÁFEGO (ROXO/INDIGO) */}
            <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xs font-bold text-indigo-600 uppercase mb-4 flex items-center gap-2"><MousePointer size={16}/> Tráfego</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Cliques</label><input type="number" disabled={isReadOnly} value={data.cliques} onChange={(e)=>handleChangeWrapper('cliques',e.target.value)} className={inputClass}/></div>
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col justify-center"><span className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">CPC</span><span className="text-lg font-bold text-indigo-800">R$ {data.cpc}</span></div>
                    <div><label className={labelClass}>Leads</label><input type="number" disabled={isReadOnly} value={data.leads} onChange={(e)=>handleChangeWrapper('leads',e.target.value)} className={inputClass}/></div>
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col justify-center"><span className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">CPL</span><span className="text-lg font-bold text-indigo-800">R$ {data.cpl}</span></div>
                </div>
                <div className="mt-4 flex justify-between items-center bg-indigo-50 border border-indigo-100 rounded-lg p-3"><span className="text-xs text-indigo-400 font-bold uppercase">Taxa Conversão (Lead)</span><span className="text-sm font-bold text-indigo-700">{data.taxa_lead}%</span></div>
            </div>

            {/* 3. COMERCIAL (LARANJA) - AGORA COM BLOCOS COLORIDOS */}
            <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xs font-bold text-orange-600 uppercase mb-4 flex items-center gap-2"><Users size={16}/> Comercial</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelClass}>Atendimentos</label><input type="number" disabled={isReadOnly} value={data.atendimentos} onChange={(e)=>handleChangeWrapper('atendimentos',e.target.value)} className={inputClass}/></div>
                        {/* Bloco Laranja Tx. Atendimento */}
                        <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex flex-col justify-center">
                            <span className="block text-[10px] font-bold text-orange-400 uppercase mb-1">Tx. Atendimento</span>
                            <span className="text-xl font-bold text-orange-900">{data.taxa_atendimento}%</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelClass}>Agendamentos</label><input type="number" disabled={isReadOnly} value={data.agendamentos} onChange={(e)=>handleChangeWrapper('agendamentos',e.target.value)} className={inputClass}/></div>
                        {/* Bloco Laranja Tx. Agendamento */}
                        <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex flex-col justify-center">
                            <span className="block text-[10px] font-bold text-orange-400 uppercase mb-1">Tx. Agendamento</span>
                            <span className="text-xl font-bold text-orange-900">{data.taxa_agendamento}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. VENDAS (VERDE) */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xs font-bold text-emerald-600 uppercase mb-4 flex items-center gap-2"><ShoppingBag size={16}/> Vendas</h3>
                <div className="mb-4"><label className="block text-[11px] font-bold text-emerald-800 uppercase mb-2 tracking-wide">Total Vendas</label><input type="number" disabled={isReadOnly} value={data.vendas} onChange={(e)=>handleChangeWrapper('vendas',e.target.value)} className={isReadOnly ? "w-full bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-4 text-emerald-700 font-bold text-2xl outline-none" : "w-full bg-white border border-emerald-400 rounded-lg px-4 py-4 text-emerald-700 font-bold text-2xl outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-sm"} /></div>
                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100"><span className="text-xs text-emerald-800 font-bold uppercase">Taxa Conversão Final</span><span className="text-2xl font-bold text-emerald-600">{data.taxa_venda}%</span></div>
            </div>
        </div>
    );
  };

  return (
    <div style={{ background: 'radial-gradient(circle at center, #e4f0f0 0%, #99c8d2 100%)' }} className="min-h-screen font-sans flex items-center justify-center p-4">
      {step === 'upload' && (
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl border border-slate-100">
            <div className="flex justify-between mb-8"><h1 className="text-xl font-bold text-[#1a3c45] flex gap-2"><Database/> Admin</h1><Link href="/"><ArrowLeft className="text-slate-400"/></Link></div>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center hover:bg-slate-50 hover:border-blue-400 relative group transition-all cursor-pointer mb-6">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <FileSpreadsheet size={48} className="text-slate-400 mb-4 group-hover:text-blue-500 transition-colors"/>
                <span className="text-sm font-bold text-slate-600">Importar Planilha CSV</span>
                <span className="text-[10px] text-slate-400 mt-1">Arrastar e soltar</span>
            </div>
            <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">ou</span></div></div>
            <button onClick={() => setStep('editor')} className="mt-6 w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                <Edit3 size={16}/> Editar Dados Salvos
            </button>
            {status === 'success' && <div className="mt-6 text-center text-emerald-700 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">Sucesso!</div>}
        </div>
      )}
      {step === 'editor' && currentRow && (
        <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl flex h-[90vh] overflow-hidden border border-slate-200">
            <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200 bg-white"><h2 className="font-bold text-[#1a3c45] flex items-center gap-2 text-lg"><Edit3 size={20}/> Meses</h2></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {tableData.map((row, idx) => (
                        <button key={row.id} onClick={() => setSelectedMonthIndex(idx)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${selectedMonthIndex === idx ? 'bg-[#1a3c45] text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                            {row.name} {selectedMonthIndex === idx && <ChevronRight size={16}/>}
                        </button>
                    ))}
                </div>
                <div className="p-6 border-t border-slate-200 bg-white">
                    <button onClick={saveFinalData} disabled={status === 'saving'} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex justify-center gap-2 shadow-lg transition-all">
                        {status === 'saving' ? <RefreshCcw size={16} className="animate-spin"/> : <Save size={16}/>} {status === 'saving' ? 'Salvando...' : 'Salvar Dados'}
                    </button>
                    <button onClick={() => setStep('upload')} className="w-full mt-3 py-2 text-red-500 text-xs font-bold hover:bg-red-50 rounded-lg flex justify-center gap-1 transition-colors"><Trash2 size={14}/> Descartar</button>
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
                <div className="p-8 pb-0 border-b border-slate-200 bg-white">
                    <h1 className="text-3xl font-bold text-[#1a3c45] mb-6 flex items-center gap-3">{currentRow.name} <span className="text-base font-normal text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">2025</span></h1>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('total')} className={`tab-btn ${activeTab === 'total' ? 'active bg-[#1a3c45] text-white' : 'text-slate-500 hover:bg-slate-100'}`}><Layers size={16}/> Visão Total</button>
                        <button onClick={() => setActiveTab('google')} className={`tab-btn ${activeTab === 'google' ? 'active bg-blue-600 text-white' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}><Globe size={16}/> Google</button>
                        <button onClick={() => setActiveTab('facebook')} className={`tab-btn ${activeTab === 'facebook' ? 'active bg-indigo-600 text-white' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}><Facebook size={16}/> Face</button>
                        <button onClick={() => setActiveTab('instagram')} className={`tab-btn ${activeTab === 'instagram' ? 'active bg-pink-600 text-white' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'}`}><Smartphone size={16}/> Insta</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'total' && <div className="mb-6 p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-sm flex items-center gap-2 font-medium"><AlertCircle size={18}/> Exibindo soma automática.</div>}
                    {activeTab === 'total' ? renderForm(currentRow.total, 'total') : null}
                    {activeTab === 'google' && renderForm(currentRow.google, 'google')}
                    {activeTab === 'facebook' && renderForm(currentRow.facebook, 'facebook')}
                    {activeTab === 'instagram' && renderForm(currentRow.instagram, 'instagram')}
                </div>
            </div>
        </div>
      )}
      <style jsx>{` .label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; } .tab-btn { padding: 12px 24px; font-size: 13px; font-weight: 700; border-radius: 12px 12px 0 0; display: flex; align-items: center; gap: 8px; transition: all 0.2s; } .custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } `}</style>
    </div>
  );
}