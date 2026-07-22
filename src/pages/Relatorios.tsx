import React, { useState, useEffect } from 'react';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { type Cliente, type Pagamento } from '@/services/db';
import { MdPictureAsPdf, MdTableChart, MdPrint, MdAnalytics, MdFileDownload } from 'react-icons/md';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Relatorios: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [faturas, setFaturas] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [c, p] = await Promise.all([
        ClienteService.getAll(),
        FinanceiroService.getAll()
      ]);
      setClientes(c);
      setFaturas(p);
    } catch (error) {
      console.error('Erro ao carregar dados para relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReportData = () => {
    return faturas.map(f => {
      const cliente = clientes.find(c => c.id === f.clienteId);
      return {
        'Mês Ref': f.referenciaMes || 'N/A',
        'Cliente': cliente?.nome || 'N/A',
        'Vencimento': format(new Date(f.data), 'dd/MM/yyyy'),
        'Bruto (R$)': f.valorTotalBruto.toFixed(2),
        'Taxa (R$)': f.valorTaxaUso.toFixed(2),
        'Líquido (R$)': f.valorLiquido.toFixed(2),
        'Status': f.status.toUpperCase()
      };
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const data = getReportData();

    doc.text('Relatório Financeiro - SolTracker', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Mês Ref', 'Cliente', 'Vencimento', 'Bruto', 'Taxa', 'Líquido', 'Status']],
      body: data.map(item => [
        item['Mês Ref'],
        item['Cliente'],
        item['Vencimento'],
        item['Bruto (R$)'],
        item['Taxa (R$)'],
        item['Líquido (R$)'],
        item['Status']
      ]),
      headStyles: { fillColor: [243, 146, 0] },
    });

    doc.save(`relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportExcel = () => {
    const data = getReportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financeiro');
    XLSX.writeFile(workbook, `relatorio_soltracker_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p>Carregando dados...</p>;

  return (
    <div style={{ textAlign: 'left' }} className="no-print">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Relatórios e Exportação</h1>
        <p>Gere e exporte dados financeiros e de clientes em diversos formatos.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Card PDF */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <MdPictureAsPdf size={48} color="#dc3545" style={{ marginBottom: '1rem' }} />
          <h3>Relatório em PDF</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Ideal para envio por email ou arquivamento oficial.
          </p>
          <button className="btn btn-primary" onClick={exportPDF} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <MdFileDownload size={20} /> Baixar PDF
          </button>
        </div>

        {/* Card Excel */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <MdTableChart size={48} color="#28a745" style={{ marginBottom: '1rem' }} />
          <h3>Planilha Excel</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Dados estruturados para análise em ferramentas de planilha.
          </p>
          <button className="btn btn-primary" onClick={exportExcel} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#28a745' }}>
            <MdFileDownload size={20} /> Baixar Excel
          </button>
        </div>

        {/* Card Print */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <MdPrint size={48} color="var(--solar-orange)" style={{ marginBottom: '1rem' }} />
          <h3>Imprimir Relatório</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Imprima a visão atual da tabela financeira diretamente.
          </p>
          <button className="btn btn-secondary" onClick={handlePrint} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <MdPrint size={20} /> Imprimir Agora
          </button>
        </div>

      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdAnalytics /> Prévia dos Dados
        </h2>
        <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Mês/Ref</th>
                <th style={{ padding: '1rem' }}>Cliente</th>
                <th style={{ padding: '1rem' }}>Bruto</th>
                <th style={{ padding: '1rem' }}>Taxa</th>
                <th style={{ padding: '1rem' }}>Líquido</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {faturas.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Sem dados para exibir.</td></tr>
              ) : (
                faturas.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{f.referenciaMes}</td>
                    <td style={{ padding: '1rem' }}>{clientes.find(c => c.id === f.clienteId)?.nome}</td>
                    <td style={{ padding: '1rem' }}>R$ {f.valorTotalBruto.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>R$ {f.valorTaxaUso.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>R$ {f.valorLiquido.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{f.status.toUpperCase()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, .sidebar, .topbar, .footer, .btn, aside {
            display: none !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          table {
            width: 100% !important;
            border: 1px solid #ccc !important;
          }
          th, td {
            border: 1px solid #eee !important;
            padding: 8px !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Relatorios;
