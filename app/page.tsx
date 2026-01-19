"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, ComposedChart, Line, Legend, Cell, LineChart 
} from 'recharts';
import { 
  Users, DollarSign, Target, Activity, TrendingUp, Eye, Lock, 
  ArrowUpRight, PieChart, ShoppingBag, Filter, Layers, BarChart2 
} from 'lucide-react';
import Link from 'next/link';

// --- TIPOS ---
type Metrics = { 
  invest: number; faturamento: number; cliques: number; leads: number; 
  atendimentos: number; agendamentos: number; comparecimentos: number; vendas: number; 
  roas?: number; cpl?: number; cpc?: number; ticket?: number;
  taxa_lead?: number; taxa_atendimento?: number; taxa_agendamento?: number; taxa_comparecimento?: number; taxa_venda?: number;
};

type MonthlyData = { id: string; name: string; google: Metrics; facebook: Metrics; instagram: Metrics; total: Metrics; };
type DataPayload = { detailed: MonthlyData[] };

// --- COMPONENTE CARD KPI ---
const KPICard = ({ title, value, sub, icon: Icon, colorTheme }: any) => {
  const colors: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  };
  const theme = colors[colorTheme] || colors.blue;
  const displayValue = value === 'NaN' || value === 'R$ NaN' || !value ? '-' : value;

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${theme.border} hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text}`}><Icon size={22} strokeWidth={2.5} /></div>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.bg} ${theme.text} px-2 py-1 rounded-full`}>MENSAL</span>
      </div>
      <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</h3>
      <div className="flex items-end gap-2 mt-1"><p className="text-2xl font-bold text-slate-800 tracking-tight">{displayValue}</p></div>
      <p className="text-slate-400 text-[10px] mt-3 flex items-center gap-1 border-t border-slate-50 pt-2"><ArrowUpRight size={12} className={theme.text}/> <span className="font-medium text-slate-500">{sub}</span></p>
    </div>
  );
};

export default function Dashboard() {
  // --- STATES ---
  const [data, setData] = useState<MonthlyData[] | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [period, setPeriod] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all'); 
  const [platformFilter, setPlatformFilter] = useState<'total' | 'google' | 'facebook' | 'instagram'>('total');
  
  // Controle Visual
  const [mainChartMetric, setMainChartMetric] = useState<'faturamento' | 'invest'>('faturamento');

  // --- FETCH DATA ---
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/metrics');
        const dbData: DataPayload = await response.json();
        if (dbData?.detailed) setData(dbData.detailed);
      } catch (error) { 
        console.error("Erro ao carregar dados", error); 
      } finally { 
        setLoading(false); 
      }
    }
    loadData();
  }, []);

  // --- PROCESSAMENTO DE DADOS (CRUCIAL) ---
  const processedData = useMemo(() => {
    if (!data) return null;

    const isSingleMonth = monthFilter !== 'all';

    // 1. Filtragem Temporal
    let slice = data;
    if (period === 'sem1') slice = data.slice(0, 6);
    if (period === 'sem2') slice = data.slice(6, 12);
    if (isSingleMonth) slice = data.filter(d => d.name === monthFilter);

    // 2. Dados Gerais (Para Gráficos de Evolução/Linha do Tempo)
    const timeSeriesData = slice.map(item => {
        const metrics = platformFilter === 'total' ? (item.total || {}) : (item[platformFilter] || {});
        return { 
            name: item.name, 
            ...metrics,
            // Garantir valores numéricos para evitar erros no gráfico
            invest: metrics.invest || 0,
            faturamento: metrics.faturamento || 0,
            leads: metrics.leads || 0,
            cpl: metrics.cpl || 0,
            vendas: metrics.vendas || 0,
            
            // Dados específicos para o gráfico de Área (Comparativo visual acumulado)
            google_fat: item.google?.faturamento || 0,
            google_inv: item.google?.invest || 0,
            face_fat: item.facebook?.faturamento || 0,
            face_inv: item.facebook?.invest || 0,
            insta_fat: item.instagram?.faturamento || 0,
            insta_inv: item.instagram?.invest || 0,
        };
    });

    // 3. Dados Comparativos de Plataforma (USADO APENAS QUANDO 1 MÊS É SELECIONADO)
    let platformComparisonData: any[] = [];
    if (isSingleMonth && slice.length > 0) {
        const item = slice[0];
        // Cria array transformando colunas em linhas para o Recharts
        platformComparisonData = [
            { 
                name: 'Google Ads', 
                fill: '#3b82f6', 
                invest: item.google?.invest || 0, 
                faturamento: item.google?.faturamento || 0,
                cpl: item.google?.cpl || 0,
                tx_agend: item.google?.taxa_agendamento || 0,
                tx_venda: item.google?.taxa_venda || 0
            },
            { 
                name: 'Facebook', 
                fill: '#6366f1', 
                invest: item.facebook?.invest || 0, 
                faturamento: item.facebook?.faturamento || 0,
                cpl: item.facebook?.cpl || 0,
                tx_agend: item.facebook?.taxa_agendamento || 0,
                tx_venda: item.facebook?.taxa_venda || 0
            },
            { 
                name: 'Instagram', 
                fill: '#ec4899', 
                invest: item.instagram?.invest || 0, 
                faturamento: item.instagram?.faturamento || 0,
                cpl: item.instagram?.cpl || 0,
                tx_agend: item.instagram?.taxa_agendamento || 0,
                tx_venda: item.instagram?.taxa_venda || 0
            },
        ];
    }

    // 4. Somatórios para os KPIs
    const sum = timeSeriesData.reduce((acc, curr) => ({
        invest: acc.invest + curr.invest,
        faturamento: acc.faturamento + curr.faturamento,
        leads: acc.leads + curr.leads,
        vendas: acc.vendas + curr.vendas,
        atendimentos: acc.atendimentos + (curr.atendimentos || 0),
        agendamentos: acc.agendamentos + (curr.agendimentos || 0),
        comparecimentos: acc.comparecimentos + (curr.comparecimentos || 0)
    }), { invest: 0, faturamento: 0, leads: 0, vendas: 0, atendimentos: 0, agendamentos: 0, comparecimentos: 0 });

    const roas = sum.invest > 0 ? sum.faturamento / sum.invest : 0;
    const ticket = sum.vendas > 0 ? sum.faturamento / sum.vendas : 0;
    const cpa = sum.vendas > 0 ? sum.invest / sum.vendas : 0;

    // 5. Dados do Funil
    const funnelData = [
        { stage: 'Leads', value: sum.leads || 0, fill: '#6366f1' }, 
        { stage: 'Atendimentos', value: sum.atendimentos || 0, fill: '#f59e0b' }, 
        { stage: 'Agendamentos', value: sum.agendamentos || 0, fill: '#f97316' }, 
        { stage: 'Comparecimentos', value: sum.comparecimentos || 0, fill: '#ec4899' }, 
        { stage: 'Vendas', value: sum.vendas || 0, fill: '#10b981' }, 
    ];

    // 6. Dados de Conversão (Histórico)
    const conversionData = timeSeriesData.map(d => ({
        name: d.name,
        tx_agend: d.taxa_agendamento || 0,
        tx_comp: d.taxa_comparecimento || 0,
        tx_venda: d.taxa_venda || 0
    }));

    return { 
        timeSeriesData, 
        platformComparisonData, 
        isSingleMonth, 
        totals: { ...sum, roas, ticket, cpa }, 
        funnelData, 
        conversionData 
    };
  }, [data, period, monthFilter, platformFilter]);

  if (loading || !processedData) return <div className="fixed inset-0 bg-[#e4f0f0] flex items-center justify-center z-50"><Activity className="animate-spin text-[#2d5d68]" size={32}/></div>;

  return (
    <div className="min-h-screen font-sans text-slate-800 relative pb-20">
      <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(circle at center, #e4f0f0 0%, #d0e6ea 60%, #99c8d2 100%)' }}></div>
      
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-auto md:h-20 py-4 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2d5d68] rounded-xl flex items-center justify-center shadow-lg shadow-[#2d5d68]/20"><Eye size={22} className="text-white" /></div>
            <div><span className="font-bold text-xl tracking-tight text-[#1a3c45] block leading-none">COSJ</span><span className="text-[11px] text-[#2d5d68] font-bold tracking-[0.2em] uppercase">Analytics</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
             {/* Filtro Plataforma */}
             <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['total', 'google', 'facebook', 'instagram'].map(p => (
                    <button key={p} onClick={() => setPlatformFilter(p as any)} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${platformFilter === p ? 'bg-[#2d5d68] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>{p}</button>
                ))}
             </div>
             
             <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block"></div>
             
             {/* Filtro Mês */}
             <div className="relative">
                <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-3 pr-8 py-2 outline-none focus:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50">
                    <option value="all">Todos os Meses</option>
                    {data?.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
                <Filter size={12} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"/>
             </div>

             {/* Filtro Semestre (Só aparece se estiver vendo tudo) */}
             {monthFilter === 'all' && (
                 <select value={period} onChange={(e) => setPeriod(e.target.value)} className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50">
                    <option value="all">Ano 2025</option>
                    <option value="sem1">1º Semestre</option>
                    <option value="sem2">2º Semestre</option>
                 </select>
             )}
             <Link href="/admin" className="p-2 bg-slate-100 hover:bg-white text-slate-500 hover:text-[#2d5d68] transition-all rounded-xl border border-slate-200"><Lock size={18} /></Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!data ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-white/60 rounded-3xl border-2 border-dashed border-slate-300">
                <h2 className="text-xl font-bold text-slate-700 mb-2">Sem Dados</h2>
            </div>
        ) : (
            <>  
                {/* --- GRÁFICO PRINCIPAL --- */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 mb-8 transition-all hover:shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-[#1a3c45] uppercase tracking-wider flex items-center gap-2">
                                {processedData.isSingleMonth ? <BarChart2 size={18} className="text-[#2d5d68]"/> : <Layers size={18} className="text-[#2d5d68]"/>}
                                {processedData.isSingleMonth ? "Comparativo de Canais (Mês Selecionado)" : "Evolução por Canal (Acumulado)"}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 ml-6">
                                {processedData.isSingleMonth ? "Comparação direta de performance entre plataformas." : "Acompanhe o crescimento e tendências mês a mês."}
                            </p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setMainChartMetric('faturamento')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${mainChartMetric === 'faturamento' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Faturamento</button>
                            <button onClick={() => setMainChartMetric('invest')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${mainChartMetric === 'invest' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Investimento</button>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {processedData.isSingleMonth ? (
                                // MODO BARRAS (Mês Único)
                                <BarChart data={processedData.platformComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12, fontWeight: 700}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                                    <Bar dataKey={mainChartMetric} radius={[6, 6, 0, 0]} barSize={60}>
                                        {processedData.platformComparisonData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                // MODO ÁREA (Evolução Temporal)
                                <AreaChart data={processedData.timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradGoogle" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                        <linearGradient id="gradFace" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                                        <linearGradient id="gradInsta" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                                    <Legend verticalAlign="top" height={36} iconType="circle"/>
                                    <Area type="monotone" name="Google Ads" dataKey={mainChartMetric === 'faturamento' ? 'google_fat' : 'google_inv'} stroke="#3b82f6" fill="url(#gradGoogle)" strokeWidth={3} fillOpacity={0.5} />
                                    <Area type="monotone" name="Facebook" dataKey={mainChartMetric === 'faturamento' ? 'face_fat' : 'face_inv'} stroke="#6366f1" fill="url(#gradFace)" strokeWidth={3} fillOpacity={0.5} />
                                    <Area type="monotone" name="Instagram" dataKey={mainChartMetric === 'faturamento' ? 'insta_fat' : 'insta_inv'} stroke="#ec4899" fill="url(#gradInsta)" strokeWidth={3} fillOpacity={0.5} />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- KPIS SECUNDÁRIOS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                  <KPICard title="Investimento" value={`R$ ${processedData.totals.invest.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`} sub="Verba Mídia" icon={DollarSign} colorTheme="blue" />
                  <KPICard title="Faturamento" value={`R$ ${processedData.totals.faturamento.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`} sub="Receita Total" icon={TrendingUp} colorTheme="emerald" />
                  <KPICard title="ROAS" value={`${processedData.totals.roas.toFixed(2)}x`} sub="Retorno Mídia" icon={Target} colorTheme="cyan" />
                  <KPICard title="Ticket Médio" value={`R$ ${processedData.totals.ticket.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`} sub="Por Venda" icon={ShoppingBag} colorTheme="purple" />
                  <KPICard title="Total Leads" value={processedData.totals.leads.toLocaleString()} sub="Oportunidades" icon={Users} colorTheme="indigo" />
                  <KPICard title="CPA (Venda)" value={`R$ ${processedData.totals.cpa.toFixed(0)}`} sub="Custo/Venda" icon={PieChart} colorTheme="orange" />
                </div>

                {/* --- GRÁFICOS INFERIORES ADAPTATIVOS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  
                  {/* 1. FINANCEIRO (Barras Lado a Lado se for mês único) */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div> 
                            {processedData.isSingleMonth ? "Financeiro por Plataforma" : "Desempenho Financeiro (Geral)"}
                        </h3>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {processedData.isSingleMonth ? (
                                // MODO MÊS: Comparativo Plataformas
                                <BarChart data={processedData.platformComparisonData} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                                    <Legend wrapperStyle={{fontSize: '11px'}} />
                                    <Bar dataKey="invest" name="Investimento" fill="#94a3b8" radius={[4,4,4,4]} barSize={20} />
                                    <Bar dataKey="faturamento" name="Faturamento" fill="#10b981" radius={[4,4,4,4]} barSize={20} />
                                </BarChart>
                            ) : (
                                // MODO TEMPO: Evolução
                                <ComposedChart data={processedData.timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" stroke="#10b981" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                                    <Bar yAxisId="left" dataKey="faturamento" name="Fat" fill="#10b981" radius={[4,4,0,0]} barSize={20} />
                                    <Line yAxisId="right" type="monotone" name="Invest" dataKey="invest" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                                </ComposedChart>
                            )}
                        </ResponsiveContainer>
                      </div>
                  </div>

                  {/* 2. FUNIL (Sempre Vertical Bar) */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-6"><h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Funil Comercial</h3></div>
                      <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={processedData.funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="stage" type="category" width={100} tick={{fontSize: 11, fontWeight: 700, fill: '#475569'}} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }} /><Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>{processedData.funnelData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar></BarChart></ResponsiveContainer></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  
                  {/* 3. CPL (Comparativo se for mês único) */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div> 
                            {processedData.isSingleMonth ? "Custo por Lead (Comparativo)" : "Eficiência de Lead (CPL)"}
                        </h3>
                      </div>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {processedData.isSingleMonth ? (
                                // MODO MÊS
                                <BarChart data={processedData.platformComparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }} formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'CPL']} />
                                    <Bar dataKey="cpl" name="CPL" radius={[4,4,0,0]} barSize={40}>
                                        {processedData.platformComparisonData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                // MODO TEMPO
                                <AreaChart data={processedData.timeSeriesData}>
                                    <defs><linearGradient id="colorCpl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }} formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'CPL']} />
                                    <Area type="monotone" name="CPL (R$)" dataKey="cpl" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCpl)" />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                      </div>
                  </div>

                  {/* 4. CONVERSÃO (Comparativo se for mês único) */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div> 
                            {processedData.isSingleMonth ? "Taxas de Conversão (Por Canal)" : "Evolução das Taxas (%)"}
                        </h3>
                      </div>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {processedData.isSingleMonth ? (
                                // MODO MÊS: Agendamento vs Venda
                                <BarChart data={processedData.platformComparisonData} barGap={0}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }} formatter={(val: number) => [`${val}%`, '']} />
                                    <Legend wrapperStyle={{fontSize: '10px'}} />
                                    <Bar dataKey="tx_agend" name="Agendamento" fill="#f59e0b" radius={[4,4,0,0]} />
                                    <Bar dataKey="tx_venda" name="Venda" fill="#10b981" radius={[4,4,0,0]} />
                                </BarChart>
                            ) : (
                                // MODO TEMPO: Linhas
                                <LineChart data={processedData.conversionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{fontSize: '10px'}} />
                                    <Line type="monotone" name="Agendamento" dataKey="tx_agend" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                    <Line type="monotone" name="Comparecimento" dataKey="tx_comp" stroke="#ec4899" strokeWidth={2} dot={false} />
                                    <Line type="monotone" name="Venda" dataKey="tx_venda" stroke="#10b981" strokeWidth={3} dot={{r:3}} />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                      </div>
                  </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}
