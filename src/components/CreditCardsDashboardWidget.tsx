import React, { useState, useMemo } from 'react';
import { CreditCard, Transaction, Account } from '../types';
import {
  calculateCardInvoice,
  getActiveInstallmentPurchases,
  getInstallmentOverallSummary,
  CARD_BRAND_DETAILS,
  ActiveInstallmentPurchase,
  CardInvoiceSummary,
} from '../utils/creditCards';
import { formatCurrency, formatDateShortYear } from '../utils/formatters';
import {
  CreditCard as CardIcon,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';

interface CreditCardsDashboardWidgetProps {
  cards: CreditCard[];
  transactions: Transaction[];
  accounts: Account[];
  onOpenNewCardModal: () => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard?: (cardId: string) => void;
  onOpenInstallmentModal?: () => void;
  onAddTransactionToCard?: (cardName: string) => void;
}

export const CreditCardsDashboardWidget: React.FC<CreditCardsDashboardWidgetProps> = ({
  cards,
  transactions,
  accounts,
  onOpenNewCardModal,
  onEditCard,
  onDeleteCard,
  onOpenInstallmentModal,
  onAddTransactionToCard,
}) => {
  const [widgetOpen, setWidgetOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'cards' | 'installments'>('all');
  const [selectedInvoiceCardId, setSelectedInvoiceCardId] = useState<string | null>(null);
  const [expandedInstallmentId, setExpandedInstallmentId] = useState<string | null>(null);
  const [installmentFilter, setInstallmentFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  // Calculate invoice summaries for all cards
  const invoiceSummaries: CardInvoiceSummary[] = useMemo(() => {
    return cards.map((card) => calculateCardInvoice(card, transactions, cards));
  }, [cards, transactions]);

  // Aggregate totals for KPI cards
  const totalLimit = useMemo(() => cards.reduce((sum, c) => sum + (c.limit || 0), 0), [cards]);
  const totalAvailableLimit = useMemo(
    () => invoiceSummaries.reduce((sum, inv) => sum + inv.availableLimit, 0),
    [invoiceSummaries]
  );
  const totalCurrentInvoices = useMemo(
    () => invoiceSummaries.reduce((sum, inv) => sum + inv.currentInvoiceAmount, 0),
    [invoiceSummaries]
  );
  const totalCommitted = useMemo(
    () => invoiceSummaries.reduce((sum, inv) => sum + inv.totalCommittedAmount, 0),
    [invoiceSummaries]
  );

  // Active installment purchases
  const allInstallments: ActiveInstallmentPurchase[] = useMemo(() => {
    return getActiveInstallmentPurchases(transactions);
  }, [transactions]);

  // Overall installment metrics
  const installmentSummary = useMemo(() => {
    return getInstallmentOverallSummary(allInstallments);
  }, [allInstallments]);

  // Filtered installments
  const filteredInstallments = useMemo(() => {
    if (installmentFilter === 'active') return allInstallments.filter((i) => !i.isCompleted);
    if (installmentFilter === 'completed') return allInstallments.filter((i) => i.isCompleted);
    return allInstallments;
  }, [allInstallments, installmentFilter]);

  return (
    <div className="col-span-1 md:col-span-2 space-y-3.5">
      {/* PAINEL PRINCIPAL: ESTILO CARD COM CABEÇALHO INTEGRADO E NAVEGAÇÃO ORGANIZADA */}
      <div className="bg-white border border-[#b8b8b8] shadow-xs">
        {/* Top Header Card */}
        <div className="bg-[#f0f0f0] border-b border-[#cccccc] px-3 sm:px-4 py-2.5 flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#5a8710] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CardIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[15px] sm:text-[16px] text-[#000000]">
                  Cartões de Crédito & Compras Parceladas
                </span>
                <span className="bg-[#5a8710] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                  {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}
                </span>
                {allInstallments.length > 0 && (
                  <span className="bg-[#0078d7] text-white text-[11px] font-black px-2 py-0.5 rounded-full hidden sm:inline-block">
                    {installmentSummary.activePurchasesCount} parcelas ativas
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-gray-600 font-bold hidden sm:block">
                Faturas dos cartões, limites disponíveis e previsão exata de quando as parcelas vão acabar
              </p>
            </div>
          </div>

          {/* Action buttons & collapse toggle */}
          <div className="flex items-center gap-2 text-[#000000]">
            <button
              type="button"
              onClick={onOpenNewCardModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black text-[12.5px] rounded-xs cursor-pointer shadow-2xs active:translate-y-px transition-colors"
              title="Cadastrar novo cartão de crédito"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo Cartão</span>
            </button>

            {onOpenInstallmentModal && (
              <button
                type="button"
                onClick={onOpenInstallmentModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-[#888888] text-[#000000] font-black text-[12.5px] rounded-xs cursor-pointer shadow-2xs active:translate-y-px transition-colors"
                title="Lançar compra parcelada em até 72x"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#0078d7]" />
                <span className="hidden xs:inline">+ Compra Parcelada</span>
                <span className="xs:hidden">+ Parcela</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setWidgetOpen(!widgetOpen)}
              className="w-7 h-7 flex items-center justify-center border border-[#999] bg-[#ffffff] hover:bg-gray-200 text-[13px] font-black cursor-pointer leading-none rounded-xs ml-1"
              title={widgetOpen ? 'Recolher seção' : 'Expandir seção'}
            >
              {widgetOpen ? '-' : '+'}
            </button>
          </div>
        </div>

        {widgetOpen && (
          <div className="p-3 sm:p-4 space-y-4">
            {/* 1. CARDS DE RESUMO EM DESTAQUE (KPI CARDS ESTILO CARD MODERNO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Faturas Atuais */}
              <div className="border border-[#b8b8b8] bg-[#ffffff] p-3 rounded-xs shadow-2xs flex flex-col justify-between border-l-4 border-l-red-600">
                <div className="flex items-center justify-between text-gray-600 font-bold text-[11.5px] uppercase">
                  <span>Faturas Abertas</span>
                  <CardIcon className="w-4 h-4 text-red-600" />
                </div>
                <div className="mt-1">
                  <div className="text-[20px] font-black text-red-600 tabular-nums leading-tight">
                    {formatCurrency(totalCurrentInvoices)}
                  </div>
                  <div className="text-[11px] text-gray-500 font-bold mt-0.5">
                    Total a pagar nas faturas do ciclo atual
                  </div>
                </div>
              </div>

              {/* Card 2: Limite Disponível */}
              <div className="border border-[#b8b8b8] bg-[#ffffff] p-3 rounded-xs shadow-2xs flex flex-col justify-between border-l-4 border-l-[#5a8710]">
                <div className="flex items-center justify-between text-gray-600 font-bold text-[11.5px] uppercase">
                  <span>Limite Disponível</span>
                  <ShieldCheck className="w-4 h-4 text-[#5a8710]" />
                </div>
                <div className="mt-1">
                  <div className="text-[20px] font-black text-[#5a8710] tabular-nums leading-tight">
                    {formatCurrency(totalAvailableLimit)}
                  </div>
                  <div className="text-[11px] text-gray-500 font-bold mt-0.5">
                    De um limite total de {formatCurrency(totalLimit)}
                  </div>
                </div>
              </div>

              {/* Card 3: Comprometimento Mensal */}
              <div className="border border-[#b8b8b8] bg-[#ffffff] p-3 rounded-xs shadow-2xs flex flex-col justify-between border-l-4 border-l-amber-600">
                <div className="flex items-center justify-between text-gray-600 font-bold text-[11.5px] uppercase">
                  <span>Parcelas por Mês</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-1">
                  <div className="text-[20px] font-black text-amber-700 tabular-nums leading-tight">
                    {formatCurrency(installmentSummary.monthlyInstallmentTotal)}
                    <span className="text-[12px] font-bold text-gray-600">/mês</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-bold mt-0.5">
                    {installmentSummary.activePurchasesCount} compras ativas parceladas
                  </div>
                </div>
              </div>

              {/* Card 4: PREVISÃO DE TÉRMINO ("QUANDO VAI ACABAR") */}
              <div className="border border-[#0078d7] bg-[#f0f8ff] p-3 rounded-xs shadow-2xs flex flex-col justify-between border-l-4 border-l-[#0078d7]">
                <div className="flex items-center justify-between text-blue-900 font-black text-[11.5px] uppercase">
                  <span>Dívida Zera Em:</span>
                  <Calendar className="w-4 h-4 text-[#0078d7]" />
                </div>
                <div className="mt-1">
                  <div className="text-[19px] sm:text-[20px] font-black text-[#0078d7] leading-tight truncate">
                    {installmentSummary.overallFinalMonthYear ? (
                      installmentSummary.overallFinalMonthYear
                    ) : (
                      <span className="text-emerald-700">Sem dívidas 🎉</span>
                    )}
                  </div>
                  <div className="text-[11px] text-blue-900 font-bold mt-0.5">
                    {installmentSummary.overallFinalDate ? (
                      <>Última parcela: {formatDateShortYear(installmentSummary.overallFinalDate)}</>
                    ) : (
                      <>Saldo 100% quitado</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BARRA DE NAVEGAÇÃO INTERNA ENTRE CARDS (ESTILO ABAS ORGANIZADAS) */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-[#cccccc] pb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-[12.5px] font-black rounded-xs cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-[#5a8710] text-white shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-[#000000]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Visão Completa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('cards')}
                  className={`px-3 py-1.5 text-[12.5px] font-black rounded-xs cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activeTab === 'cards'
                      ? 'bg-[#5a8710] text-white shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-[#000000]'
                  }`}
                >
                  <CardIcon className="w-3.5 h-3.5" />
                  <span>Cartões & Faturas ({cards.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('installments')}
                  className={`px-3 py-1.5 text-[12.5px] font-black rounded-xs cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activeTab === 'installments'
                      ? 'bg-[#0078d7] text-white shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-[#000000]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Previsão de Parcelas ({allInstallments.length})</span>
                </button>
              </div>

              {/* Informação contextual */}
              <div className="text-[12px] text-gray-600 font-bold flex items-center gap-1.5">
                <span>Saldo total restante:</span>
                <strong className="text-amber-800 font-black tabular-nums">
                  {formatCurrency(installmentSummary.totalRemainingDebt)}
                </strong>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO A: MEUS CARTÕES DE CRÉDITO (ESTILO CARDS FÍSICOS E EXECUTIVOS) */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'cards') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[14.5px] text-[#000000]">
                      Meus Cartões de Crédito ({cards.length})
                    </span>
                    <span className="text-[11.5px] text-gray-500 font-bold hidden sm:inline">
                      • Clique em "Ver Fatura" para consultar despesas detalhadas
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenNewCardModal}
                    className="text-[#5a8710] hover:underline font-black text-[12.5px] cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar outro cartão</span>
                  </button>
                </div>

                {cards.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-[#cccccc] rounded-xs bg-[#fafafa] space-y-2.5">
                    <div className="w-11 h-11 mx-auto rounded-full bg-[#f1f6df] text-[#5a8710] flex items-center justify-center">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-black text-[15px] text-[#000000]">
                        Nenhum cartão cadastrado
                      </h4>
                      <p className="text-[12.5px] text-gray-600 max-w-md mx-auto">
                        Cadastre seus cartões para controlar limite disponível, vencimento, fechamento e faturas automáticas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenNewCardModal}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black text-[13px] rounded-xs cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Cadastrar Primeiro Cartão</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {invoiceSummaries.map((inv) => {
                      const card = inv.card;
                      const isSelectedForInvoice = selectedInvoiceCardId === card.id;
                      const brandInfo = CARD_BRAND_DETAILS[card.brand] || CARD_BRAND_DETAILS.outro;

                      // Limit bar color indicator
                      let barColor = 'bg-[#5a8710]';
                      if (inv.limitUsedPercent >= 80) barColor = 'bg-red-600';
                      else if (inv.limitUsedPercent >= 50) barColor = 'bg-amber-500';

                      return (
                        <div
                          key={card.id}
                          className="border border-[#b8b8b8] rounded-xs bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between overflow-hidden"
                        >
                          {/* Top Card Header estilo Cartão de Banco */}
                          <div
                            className="p-3 text-white flex items-center justify-between relative select-none"
                            style={{
                              background: card.color
                                ? `linear-gradient(135deg, ${card.color} 0%, #1e293b 100%)`
                                : 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                            }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {/* Chip Icon */}
                              <div className="w-5 h-4 rounded-xs bg-amber-400/80 border border-amber-300 flex items-center justify-center shrink-0">
                                <span className="block w-2.5 h-1.5 border-t border-b border-amber-700/60"></span>
                              </div>
                              <span className="font-black text-[14px] truncate tracking-wide uppercase">
                                {card.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10.5px] font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded border border-white/20">
                                {brandInfo.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => onEditCard(card)}
                                className="text-white hover:text-amber-300 p-1 cursor-pointer transition-colors"
                                title="Editar configurações deste cartão"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteCard && (
                                <button
                                  type="button"
                                  onClick={() => setCardToDelete(card)}
                                  className="text-white/80 hover:text-red-300 p-1 cursor-pointer transition-colors"
                                  title="Excluir este cartão"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Card Body Information */}
                          <div className="p-3.5 space-y-3 text-[13px]">
                            {/* Fatura Aberta Highlight */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <div>
                                <span className="text-gray-500 font-bold block text-[11px] uppercase">
                                  Fatura Atual
                                </span>
                                <span className="text-[19px] font-black text-red-600 tabular-nums leading-tight">
                                  {formatCurrency(inv.currentInvoiceAmount)}
                                </span>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`text-[11px] font-black px-2 py-0.5 rounded-full inline-block ${
                                    inv.isOpen
                                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                                  }`}
                                >
                                  {inv.isOpen ? 'Aberta' : 'Fechada'}
                                </span>
                                <span className="text-[11px] text-gray-600 font-bold block mt-0.5">
                                  Vence {formatDateShortYear(inv.dueDateStr)}
                                </span>
                              </div>
                            </div>

                            {/* Informações de Ciclo: Fechamento, Melhor dia e Vencimento */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[12px] bg-gray-50 p-2.5 rounded-xs border border-gray-200 font-bold">
                              <div>
                                <span className="text-gray-500 block text-[10px] uppercase">MELHOR COMPRA (FECHA)</span>
                                <span className="text-[#5a8710] font-black text-[13px]">
                                  Dia {card.closingDay}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-[10px] uppercase">VENCIMENTO DA FATURA</span>
                                <span className="text-red-700 font-black text-[13px]">
                                  Dia {card.dueDay}
                                </span>
                              </div>
                              <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                                <span className="text-gray-500 block text-[10px] uppercase">STATUS DO CICLO</span>
                                <span className="text-gray-800 font-black text-[12px]">
                                  {inv.isOpen ? 'Fatura Aberta' : 'Fatura Fechada'}
                                </span>
                              </div>
                            </div>

                            {/* Barra de Progresso do Limite */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11.5px] font-bold">
                                <span className="text-gray-600">
                                  Limite Disponível:{' '}
                                  <strong className="text-[#5a8710] font-black">
                                    {formatCurrency(inv.availableLimit)}
                                  </strong>
                                </span>
                                <span className="text-gray-600 font-bold tabular-nums">
                                  {inv.limitUsedPercent}% usado
                                </span>
                              </div>

                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`${barColor} h-full transition-all duration-300`}
                                  style={{ width: `${Math.min(100, inv.limitUsedPercent)}%` }}
                                />
                              </div>

                              <div className="flex justify-between text-[10.5px] text-gray-500 font-bold pt-0.5">
                                <span>Total Comprometido: {formatCurrency(inv.totalCommittedAmount)}</span>
                                <span>Limite: {formatCurrency(card.limit)}</span>
                              </div>
                            </div>

                            {/* Ações do Card */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[12px] flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedInvoiceCardId(isSelectedForInvoice ? null : card.id)
                                }
                                className={`font-black hover:underline cursor-pointer flex items-center gap-1 ${
                                  isSelectedForInvoice ? 'text-[#5a8710]' : 'text-blue-700'
                                }`}
                              >
                                <span>
                                  {isSelectedForInvoice ? 'Ocultar Lançamentos' : 'Ver Fatura Detalhada'}
                                </span>
                                {isSelectedForInvoice ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditCard(card)}
                                  className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded-xs font-black text-gray-800 text-[11.5px] cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Editar cartão"
                                >
                                  <Pencil className="w-3 h-3 text-gray-700" />
                                  <span>Editar</span>
                                </button>

                                {onDeleteCard && (
                                  <button
                                    type="button"
                                    onClick={() => setCardToDelete(card)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xs font-black text-red-700 text-[11.5px] cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Excluir cartão"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                    <span>Excluir</span>
                                  </button>
                                )}

                                {onAddTransactionToCard && (
                                  <button
                                    type="button"
                                    onClick={() => onAddTransactionToCard(card.name)}
                                    className="px-2.5 py-1 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black rounded-xs text-[11.5px] cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Lançar</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Seção Expansível com Detalhamento de Lançamentos desta Fatura */}
                          {isSelectedForInvoice && (
                            <div className="border-t border-[#cccccc] bg-gray-50 p-3 space-y-2 text-[12px]">
                              <div className="font-black text-[#000000] flex justify-between items-center border-b border-gray-200 pb-1">
                                <span>Lançamentos na fatura atual:</span>
                                <span className="text-red-700 font-black">
                                  {inv.invoiceTransactions.length} itens (
                                  {formatCurrency(inv.currentInvoiceAmount)})
                                </span>
                              </div>

                              {inv.invoiceTransactions.length === 0 ? (
                                <div className="py-2.5 text-center text-gray-500 font-bold">
                                  Nenhuma despesa lançada nesta fatura ainda.
                                </div>
                              ) : (
                                <div className="max-h-44 overflow-y-auto space-y-1 divide-y divide-gray-200 pr-1">
                                  {inv.invoiceTransactions.map((tx) => (
                                    <div
                                      key={tx.id}
                                      className="flex items-center justify-between pt-1 font-bold text-[#000000]"
                                    >
                                      <div className="truncate max-w-[180px]">
                                        <span className="truncate block font-black">{tx.description}</span>
                                        <span className="block text-[10.5px] text-gray-500 font-normal">
                                          {formatDateShortYear(tx.date)} • {tx.category}
                                        </span>
                                      </div>
                                      <span className="tabular-nums font-black text-red-600">
                                        {formatCurrency(Math.abs(tx.amount))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {inv.futureInstallmentsAmount > 0 && (
                                <div className="pt-2 border-t border-gray-200 flex justify-between text-[11px] text-gray-600 font-bold">
                                  <span>Parcelas futuras comprometidas:</span>
                                  <span className="text-gray-900 font-black tabular-nums">
                                    {formatCurrency(inv.futureInstallmentsAmount)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO B: COMPRAS PARCELADAS (ESTILO CARD ORGANIZADO & QUANDO VAI ACABAR) */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'installments') && (
              <div className="space-y-3 pt-2">
                {/* Header da Sub-seção de Parcelas */}
                <div className="flex items-center justify-between flex-wrap gap-2 border-t border-[#cccccc] pt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5 text-[#0078d7]" />
                    <span className="font-black text-[15px] text-[#000000]">
                      Compras Parceladas & Previsão de Término
                    </span>
                    <span className="bg-[#0078d7] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                      {installmentSummary.activePurchasesCount} ativas
                    </span>
                  </div>

                  {/* Filtros em Pílulas */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-gray-500 mr-1 hidden sm:inline">Exibir:</span>
                    <button
                      type="button"
                      onClick={() => setInstallmentFilter('active')}
                      className={`px-2.5 py-1 rounded-xs cursor-pointer ${
                        installmentFilter === 'active'
                          ? 'bg-[#0078d7] text-white font-black'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Ativas ({allInstallments.filter((i) => !i.isCompleted).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallmentFilter('all')}
                      className={`px-2.5 py-1 rounded-xs cursor-pointer ${
                        installmentFilter === 'all'
                          ? 'bg-[#0078d7] text-white font-black'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Todas ({allInstallments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallmentFilter('completed')}
                      className={`px-2.5 py-1 rounded-xs cursor-pointer ${
                        installmentFilter === 'completed'
                          ? 'bg-[#0078d7] text-white font-black'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Quitadas ({allInstallments.filter((i) => i.isCompleted).length})
                    </button>
                  </div>
                </div>

                {/* Lista de Parcelas em Estilo Cards Individuais Organizados */}
                {filteredInstallments.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-[#cccccc] rounded-xs bg-[#fafafa] space-y-2.5">
                    <Clock className="w-8 h-8 mx-auto text-gray-400" />
                    <div className="font-black text-[15px] text-[#000000]">
                      {installmentFilter === 'active'
                        ? 'Nenhuma compra parcelada em andamento'
                        : 'Nenhum parcelamento encontrado'}
                    </div>
                    <p className="text-[12.5px] text-gray-600 max-w-sm mx-auto">
                      Ao lançar despesas no cartão parceladas em várias vezes (ex: 10x, 12x), o sistema calcula
                      automaticamente o saldo restante e o mês exato de término.
                    </p>
                    {onOpenInstallmentModal && (
                      <button
                        type="button"
                        onClick={onOpenInstallmentModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black text-[13px] rounded-xs cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Lançar Nova Compra Parcelada</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredInstallments.map((item) => {
                      const isExpanded = expandedInstallmentId === item.id;
                      const isLastMonth = item.remainingInstallments === 1;

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xs transition-shadow shadow-2xs overflow-hidden ${
                            item.isCompleted
                              ? 'border-gray-200 bg-gray-50/70'
                              : isLastMonth
                              ? 'border-emerald-300 bg-white ring-1 ring-emerald-200'
                              : 'border-[#b8b8b8] bg-white hover:border-gray-400'
                          }`}
                        >
                          {/* Card Content Organizado em 3 Seções: Info, Valores e O Destaque de Término */}
                          <div className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                            {/* BLOCO 1: NOME DA COMPRA, CARTÃO E PROGRESSO */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-[15px] text-[#000000] truncate">
                                  {item.description}
                                </span>

                                <span className="bg-gray-100 text-gray-800 text-[11px] font-black px-2 py-0.5 rounded border border-gray-300">
                                  💳 {item.account}
                                </span>

                                <span className="text-[11px] text-gray-600 font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                  {item.category}
                                </span>

                                {item.isCompleted ? (
                                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    100% Quitada
                                  </span>
                                ) : isLastMonth ? (
                                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                                    Última Parcela Este Mês!
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-gray-500">
                                    Em andamento
                                  </span>
                                )}
                              </div>

                              {/* Indicador de Parcela Atual & Valor Mensal */}
                              <div className="flex items-center gap-3 text-[13px] text-[#000000] font-bold flex-wrap">
                                <span>
                                  Parcela{' '}
                                  <strong className="text-black font-black">
                                    {Math.min(
                                      item.totalInstallments,
                                      item.paidInstallments + (item.isCompleted ? 0 : 1)
                                    )}
                                  </strong>{' '}
                                  de <strong className="font-black">{item.totalInstallments}</strong>
                                </span>
                                <span>•</span>
                                <span className="text-red-600 font-black tabular-nums">
                                  {formatCurrency(item.installmentAmount)}/mês
                                </span>
                                <span>•</span>
                                <span className="text-gray-600 font-bold tabular-nums">
                                  Valor Total: {formatCurrency(item.totalAmount)}
                                </span>
                              </div>

                              {/* Barra de Progresso Visual de Pagamento */}
                              <div className="flex items-center gap-2.5 pt-0.5 max-w-md">
                                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      item.isCompleted
                                        ? 'bg-emerald-600'
                                        : item.progressPercent > 70
                                        ? 'bg-blue-600'
                                        : 'bg-[#5a8710]'
                                    }`}
                                    style={{ width: `${item.progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-black text-gray-600 tabular-nums shrink-0">
                                  {item.progressPercent}% pago ({item.paidInstallments}/{item.totalInstallments})
                                </span>
                              </div>
                            </div>

                            {/* BLOCO 2 & 3: SALDO RESTANTE + CARD "QUANDO VAI ACABAR" */}
                            <div className="flex items-center justify-between lg:justify-end gap-3.5 border-t lg:border-t-0 pt-2.5 lg:pt-0 shrink-0 flex-wrap">
                              {/* Saldo Devedor Restante */}
                              <div className="text-left lg:text-right">
                                <span className="text-[10.5px] uppercase font-bold text-gray-500 block">
                                  Saldo Restante
                                </span>
                                <span
                                  className={`text-[16px] font-black tabular-nums block ${
                                    item.isCompleted ? 'text-gray-400' : 'text-amber-800'
                                  }`}
                                >
                                  {item.isCompleted ? 'R$ 0,00' : formatCurrency(item.remainingAmount)}
                                </span>
                                <span className="text-[10.5px] text-gray-500 font-bold block">
                                  {item.remainingInstallments} {item.remainingInstallments === 1 ? 'parcela restante' : 'parcelas restantes'}
                                </span>
                              </div>

                              {/* DESTAQUE PRINCIPAL: QUANDO VAI ACABAR (ESTILO CARD DESTACADO) */}
                              <div className="bg-[#f0f8ff] border border-blue-200 p-2.5 rounded-xs min-w-[155px] text-right shadow-2xs">
                                <div className="flex items-center justify-end gap-1 text-[10.5px] uppercase font-black text-blue-900">
                                  <Calendar className="w-3.5 h-3.5 text-[#0078d7]" />
                                  <span>Vai Acabar Em:</span>
                                </div>
                                <div className="font-black text-[14.5px] text-[#0078d7] leading-tight mt-0.5">
                                  {item.finalMonthYear}
                                </div>
                                <div
                                  className={`text-[11px] font-bold block mt-0.5 ${
                                    item.isCompleted
                                      ? 'text-emerald-700'
                                      : isLastMonth
                                      ? 'text-emerald-800 font-black'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {item.timeRemainingText}
                                </div>
                              </div>

                              {/* Botão de Expandir Cronograma Completo */}
                              <button
                                type="button"
                                onClick={() => setExpandedInstallmentId(isExpanded ? null : item.id)}
                                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xs border border-gray-300 cursor-pointer flex items-center gap-1 text-xs font-bold transition-colors"
                                title={isExpanded ? 'Recolher cronograma' : 'Ver todas as parcelas'}
                              >
                                <span className="hidden sm:inline">
                                  {isExpanded ? 'Ocultar' : 'Parcelas'}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Seção Expansível: Linha do Tempo e Cronograma de cada parcela */}
                          {isExpanded && (
                            <div className="bg-[#f8f9fa] border-t border-gray-200 p-3 sm:p-4 text-[12.5px] space-y-2.5">
                              <div className="flex items-center justify-between font-black text-[#000000] border-b border-gray-200 pb-1.5 flex-wrap gap-2">
                                <span className="flex items-center gap-1.5">
                                  <span>Cronograma Completo das Parcelas:</span>
                                  <span className="text-gray-500 text-xs font-normal">
                                    ({item.paidInstallments} pagas / {item.remainingInstallments} restantes)
                                  </span>
                                </span>
                                <span className="text-gray-600 font-bold text-xs">
                                  Início: {formatDateShortYear(item.startDate)} • Término:{' '}
                                  <strong className="text-[#0078d7]">{formatDateShortYear(item.finalDate)}</strong>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                                {item.transactions.map((tx, idx) => {
                                  const isPaid = tx.isConsolidated || tx.date <= new Date().toISOString().split('T')[0];
                                  const isCurrent =
                                    !isPaid &&
                                    (idx === 0 || item.transactions[idx - 1]?.date <= new Date().toISOString().split('T')[0]);

                                  return (
                                    <div
                                      key={tx.id}
                                      className={`p-2 rounded border text-xs flex items-center justify-between transition-all ${
                                        isPaid
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                          : isCurrent
                                          ? 'bg-blue-50 border-blue-400 text-blue-950 font-black ring-1 ring-blue-300 shadow-2xs'
                                          : 'bg-white border-gray-200 text-gray-700 font-semibold'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center gap-1">
                                          {isPaid ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                          ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                                          )}
                                          <span>
                                            {idx + 1}ª de {item.totalInstallments}
                                          </span>
                                        </div>
                                        <span className="text-[11px] opacity-75 block mt-0.5">
                                          {formatDateShortYear(tx.date)}
                                        </span>
                                      </div>
                                      <span className="tabular-nums font-black">
                                        {formatCurrency(Math.abs(tx.amount))}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Card Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-500 shadow-2xl p-4 sm:p-5 max-w-md w-full rounded-xs space-y-3.5">
            <div className="flex items-center gap-2.5 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-black text-[15.5px]">Excluir Cartão de Crédito?</h4>
            </div>
            <p className="text-[13px] text-gray-800 font-medium">
              Tem certeza que deseja excluir o cartão <strong>"{cardToDelete.name}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-3 py-1.5 border border-gray-400 bg-white hover:bg-gray-100 font-bold text-[12.5px] rounded-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCard) onDeleteCard(cardToDelete.id);
                  setCardToDelete(null);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[12.5px] rounded-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
