import pandas as pd
import json

# Carrega o CSV limpo (gerado anteriormente)
# Se não tiver o dados_limpos.csv, rode o script de limpeza anterior
try:
    df = pd.read_csv("dados_limpos.csv")
except FileNotFoundError:
    print("Erro: Gere o arquivo 'dados_limpos.csv' primeiro.")
    exit()

# Mapeamento de meses para ordenar corretamente
meses_map = {
    "JANEIRO": "Jan", "FEVEREIRO": "Fev", "MARÇO": "Mar", "ABRIL": "Abr",
    "MAIO": "Mai", "JUNHO": "Jun", "JULHO": "Jul", "AGOSTO": "Ago",
    "SETEMBRO": "Set", "OUTUBRO": "Out", "NOVEMBRO": "Nov", "DEZEMBRO": "Dez"
}
ordem_meses = list(meses_map.values())

# 1. Processar Dados Mensais (Visão Geral)
df_total = df[df['Platform'] == 'Total']
pivot = df_total.pivot_table(index='Month', columns='Metric', values='Value', aggfunc='sum').reset_index()

dados_mensais = []
for _, row in pivot.iterrows():
    nome_mes_curto = meses_map.get(row['Month'], row['Month'][:3])
    dados_mensais.append({
        "name": nome_mes_curto,
        "invest": row.get('Investimento ( mkt)', 0),
        "faturamento": row.get('Faturamento', 0),
        "leads": int(row.get('Leads (Contatos Recebidos) (mkt)', 0)),
        "roas": row.get('ROAS', 0)
    })

# Ordenar cronologicamente
dados_mensais.sort(key=lambda x: ordem_meses.index(x['name']) if x['name'] in ordem_meses else 99)

# 2. Processar Dados por Plataforma
df_plat = df[df['Platform'] != 'Total']
pivot_plat = df_plat[df_plat['Metric'] == 'Investimento ( mkt)'].pivot_table(index='Month', columns='Platform', values='Value', aggfunc='sum').reset_index()

dados_plataforma = []
for _, row in pivot_plat.iterrows():
    nome_mes_curto = meses_map.get(row['Month'], row['Month'][:3])
    item = {"name": nome_mes_curto}
    for col in pivot_plat.columns:
        if col != 'Month':
            item[col.lower()] = row[col] # facebook, google, instagram
    dados_plataforma.append(item)

dados_plataforma.sort(key=lambda x: ordem_meses.index(x['name']) if x['name'] in ordem_meses else 99)

# 3. Processar Funil (Acumulado)
metricas_funil = [
    'Cliques (mkt)', 'Leads (Contatos Recebidos) (mkt)', 
    'Atendimentos (Conversas sem vácuo)', 'Agendamentos', 'Pessoas que compraram'
]
df_funil = df_total[df_total['Metric'].isin(metricas_funil)].groupby('Metric')['Value'].sum()

dados_funil = []
nomes_amigaveis = {
    'Cliques (mkt)': 'Cliques',
    'Leads (Contatos Recebidos) (mkt)': 'Leads',
    'Atendimentos (Conversas sem vácuo)': 'Atendimentos',
    'Agendamentos': 'Agendamentos',
    'Pessoas que compraram': 'Vendas'
}

for metrica in metricas_funil:
    if metrica in df_funil:
        dados_funil.append({
            "stage": nomes_amigaveis[metrica],
            "value": int(df_funil[metrica])
        })

# Estrutura Final do JSON
dashboard_data = {
    "monthly": dados_mensais,
    "platforms": dados_plataforma,
    "funnel": dados_funil
}

# Salvar na pasta do projeto Next.js (ajuste o caminho se necessário)
# Vamos salvar na pasta 'public' para ser acessível como se fosse uma API
with open("dashboard-marketing/public/data.json", "w", encoding='utf-8') as f:
    json.dump(dashboard_data, f, indent=2)

print("Arquivo 'public/data.json' gerado com sucesso!")