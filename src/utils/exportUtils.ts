import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { type Cliente, type Pagamento } from '@/services/db';

export const exportToPDF = (faturas: Pagamento[], clientes: Cliente[]) => {
  const doc = new jsPDF();
  const data = faturas.map(f => {
    const cliente = clientes.find(c => c.id === f.clienteId);
    return [
      f.referenciaMes || 'N/A',
      cliente?.nome || 'N/A',
      format(new Date(f.data), 'dd/MM/yyyy'),
      `R$ ${f.valorTotalBruto.toFixed(2)}`,
      `R$ ${f.valorTaxaUso.toFixed(2)}`,
      `R$ ${f.valorLiquido.toFixed(2)}`,
      f.status.toUpperCase()
    ];
  });

  doc.text('Relatorio Financeiro - SolTracker', 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

  autoTable(doc, {
    startY: 30,
    head: [['Mes Ref', 'Cliente', 'Vencimento', 'Bruto', 'Taxa', 'Liquido', 'Status']],
    body: data as any,
    headStyles: { fillColor: [243, 146, 0] },
  });

  doc.save(`relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportToExcel = (faturas: Pagamento[], clientes: Cliente[]) => {
  const data = faturas.map(f => {
    const cliente = clientes.find(c => c.id === f.clienteId);
    return {
      'Mes Ref': f.referenciaMes || 'N/A',
      'Cliente': cliente?.nome || 'N/A',
      'Vencimento': format(new Date(f.data), 'dd/MM/yyyy'),
      'Bruto (R$)': f.valorTotalBruto.toFixed(2),
      'Taxa (R$)': f.valorTaxaUso.toFixed(2),
      'Liquido (R$)': f.valorLiquido.toFixed(2),
      'Status': f.status.toUpperCase()
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Financeiro');
  XLSX.writeFile(workbook, `relatorio_soltracker_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
