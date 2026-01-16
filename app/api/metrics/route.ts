// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define onde o arquivo "banco de dados" ficará salvo
const DB_PATH = path.join(process.cwd(), 'database.json');

// Rota GET: Chamada quando abrimos o site para carregar dados salvos
export async function GET() {
  try {
    // Se o banco ainda não existe, retorna nulo
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json(null);
    }
    // Lê o arquivo e retorna para o front-end
    const fileContents = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao ler banco de dados' }, { status: 500 });
  }
}

// Rota POST: Chamada quando fazemos upload de um novo CSV
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Salva os dados no arquivo JSON (sobrescreve o anterior)
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, message: "Dados salvos com sucesso!" });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 });
  }
}