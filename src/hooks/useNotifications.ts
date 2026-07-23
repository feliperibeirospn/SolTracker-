import { useEffect } from 'react';
import { ClienteService } from '@/services/clienteService';
import { FinanceiroService } from '@/services/financeiroService';
import { differenceInDays, isToday, isSameDay, isSameMonth } from 'date-fns';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const [clientes, faturas] = await Promise.all([
          ClienteService.getAll(),
          FinanceiroService.getAll()
        ]);

        const today = new Date();

        // 1. Vencimentos de hoje
        const vencemHoje = faturas.filter(f => f.status === 'pendente' && isToday(new Date(f.data)));
        if (vencemHoje.length > 0) {
          toast(`Hoje vencem ${vencemHoje.length} faturas.`, {
            icon: '📅',
            duration: 6000,
          });
        }

        // 2. Atrasos específicos
        const atrasados = faturas.filter(f => f.status === 'atrasado');
        atrasados.forEach(f => {
          const cliente = clientes.find(c => c.id === f.clienteId);
          const dias = differenceInDays(today, new Date(f.data));
          if (dias > 0) {
            toast(`${cliente?.nome || 'Cliente'} está atrasado há ${dias} dias.`, {
              icon: '⚠️',
              duration: 5000,
            });
          }
        });

        // 3. Aniversários de contrato
        clientes.forEach(c => {
          const dataInicio = new Date(c.dataInicio);
          // Verifica se hoje é o mesmo dia e mês do início, e se passou pelo menos 1 ano
          if (isSameDay(today, dataInicio) === false && isSameMonth(today, dataInicio) && today.getDate() === dataInicio.getDate()) {
            const anos = today.getFullYear() - dataInicio.getFullYear();
            if (anos > 0) {
              toast(`${c.nome} completa ${anos} ano${anos > 1 ? 's' : ''} de contrato! 🥳`, {
                duration: 8000,
              });
            }
          }
        });

      } catch (error) {
        console.error('Falha ao processar notificações:', error);
      }
    };

    // Executa apenas uma vez ao montar (login/abertura)
    checkNotifications();
  }, []);
};
