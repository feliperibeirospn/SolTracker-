import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ClienteService } from '@/services/clienteService';
import { MdFileUpload, MdCheckCircle, MdError, MdInfo } from 'react-icons/md';
import '@/styles/forms.css';

const Importacao: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null);

  const processData = async (data: any[]) => {
    setLoading(true);
    let success = 0;
    let errors = 0;

    for (const row of data) {
      try {
        // Mapeamento flexível de colunas
        const nome = row.Nome || row.nome || row.NOME;
        const saldo = parseFloat(row.Saldo || row.saldo || row.SALDO || '0');
        const consumo = parseFloat(row.Consumo || row.consumo || row.CONSUMO || '0');
        const valor = parseFloat(row.Valor || row.valor || row.VALOR || '0');

        if (!nome) continue; // Pula linhas vazias ou sem nome

        await ClienteService.create({
          nome,
          saldoAtual: isNaN(saldo) ? 0 : saldo,
          consumoMedio: isNaN(consumo) ? 0 : consumo,
          valorMensal: isNaN(valor) ? 0 : valor,
          // Campos padrão para integridade
          telefone: row.Telefone || row.telefone || '(00) 00000-0000',
          documento: row.Documento || row.CPF || row.cpf || '000.000.000-00',
          email: row.Email || row.email || 'import@email.com',
          cidade: row.Cidade || row.cidade || 'Importado',
          distribuidora: row.Distribuidora || row.distribuidora || 'Indefinida',
          percentualDesconto: parseFloat(row.Desconto || '20'),
          dataInicio: new Date(),
          dataCadastro: new Date(),
        } as any);
        success++;
      } catch (err) {
        console.error('Erro ao importar linha:', row, err);
        errors++;
      }
    }

    setResults({ success, errors });
    setLoading(false);
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processData(results.data);
      },
    });
  };

  const handleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      processData(data);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Importação de Dados</h1>
        <p>Importe clientes em lote via CSV ou Excel (XLSX).</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <MdFileUpload size={48} color="var(--solar-orange)" style={{ marginBottom: '1rem' }} />
          <h3>Importar CSV</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Reconhece: Nome, Saldo, Consumo, Valor.
          </p>
          <label className="btn btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}>
            Selecionar CSV
            <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} disabled={loading} />
          </label>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <MdFileUpload size={48} color="var(--solar-yellow)" style={{ marginBottom: '1rem' }} />
          <h3>Importar Excel</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Suporta arquivos .xlsx e .xls com as mesmas colunas.
          </p>
          <label className="btn btn-primary" style={{ display: 'inline-block', cursor: 'pointer', backgroundColor: 'var(--solar-yellow)', color: '#000' }}>
            Selecionar Excel
            <input type="file" accept=".xlsx, .xls" onChange={handleExcel} style={{ display: 'none' }} disabled={loading} />
          </label>
        </div>
      </div>

      {loading && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Processando importação... Por favor, aguarde.</p>
        </div>
      )}

      {results && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdCheckCircle color="#28a745" size={24} />
            <strong>Importação Concluída!</strong>
          </div>
          <p>Sucesso: <span style={{ color: '#28a745', fontWeight: 'bold' }}>{results.success}</span> clientes importados.</p>
          {results.errors > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc3545' }}>
              <MdError size={20} />
              <span>Erros: {results.errors} linhas falharam.</span>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => setResults(null)}>Limpar</button>
        </div>
      )}

      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: 'rgba(253, 184, 19, 0.05)',
        borderRadius: '8px',
        border: '1px solid var(--solar-yellow)'
      }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--solar-orange)', margin: '0 0 1rem 0' }}>
          <MdInfo /> Instruções de Importação
        </h4>
        <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <li>A primeira linha do arquivo deve conter os nomes das colunas.</li>
          <li>Colunas obrigatórias reconhecidas: <strong>Nome, Saldo, Consumo, Valor</strong>.</li>
          <li>Colunas opcionais recomendadas: <strong>Telefone, Documento, Email, Cidade, Distribuidora</strong>.</li>
          <li>Se colunas opcionais não forem fornecidas, o sistema usará valores padrão.</li>
          <li>O formato do separador CSV deve ser vírgula ou ponto e vírgula.</li>
        </ul>
      </div>
    </div>
  );
};

export default Importacao;
