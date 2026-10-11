import React, { useState } from 'react';
import { Account, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Trash2, Plus, Edit2, ShieldCheck } from 'lucide-react';

interface ConfiguracoesViewProps {
  accounts: Account[];
  categories: Category[];
  onAddCategory: (cat: Category) => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onOpenNewAccountModal: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onResetDataToZero?: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  accounts,
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onOpenNewAccountModal,
  onEditAccount,
  onDeleteAccount,
  onResetDataToZero,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'contas' | 'categorias' | 'regras'>('contas');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'despesa' | 'receita'>('despesa');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
    });
    setNewCatName('');
  };

  return (
    <div className="flex-1 bg-white min-w-0 text-[14.5px] font-sans select-none space-y-4 text-[#000000]">
      <div className="pb-2 border-b border-[#bbbbbb] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-[16px] font-black text-[#000000]">Configurações do Sistema</h2>
          <p className="text-[13px] text-[#000000] font-bold">Gerencie suas contas, plano de categorias e regras automáticas.</p>
        </div>

        {/* Subtabs */}
        <div className="flex border-2 border-[#888888] rounded-xs overflow-hidden">
          <button
            onClick={() => setActiveSubTab('contas')}
            className={`px-4 py-1.5 text-[13.5px] font-black cursor-pointer ${
              activeSubTab === 'contas' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Contas
          </button>
          <button
            onClick={() => setActiveSubTab('categorias')}
            className={`px-4 py-1.5 text-[13.5px] font-black cursor-pointer ${
              activeSubTab === 'categorias' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Categorias
          </button>
          <button
            onClick={() => setActiveSubTab('regras')}
            className={`px-4 py-1.5 text-[13.5px] font-black cursor-pointer ${
              activeSubTab === 'regras' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Regras
          </button>
        </div>
      </div>

      {activeSubTab === 'contas' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-black text-[14.5px] text-[#000000]">Contas Cadastradas ({accounts.length})</span>
            <button
              onClick={onOpenNewAccountModal}
              className="bg-[#5a8710] hover:bg-[#4d740c] text-white px-4 py-1.5 font-black rounded-xs text-[13px] cursor-pointer"
            >
              + Nova Conta
            </button>
          </div>

          <div className="border border-[#b8b8b8] bg-white">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#e8e8e8] border-b border-[#b8b8b8] font-black text-[#000000]">
                  <th className="p-2.5 font-black">Nome</th>
                  <th className="p-2.5 font-black">Tipo</th>
                  <th className="p-2.5 text-right font-black">Saldo Atual</th>
                  <th className="p-2.5 text-center w-24 font-black">Ações</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-b border-gray-200 hover:bg-[#f9f9f9] group">
                    <td className="p-2.5 font-black text-[#000000]">{acc.name}</td>
                    <td className="p-2.5 text-[#000000] capitalize font-bold">{acc.type}</td>
                    <td className="p-2.5 text-right font-black tabular-nums text-[#000000]">{formatCurrency(acc.balance)}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditAccount(acc)}
                          className="text-[#000000] hover:text-[#5a8710] font-black p-0.5 cursor-pointer text-[14px]"
                          title="Editar conta"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAccount(acc.id)}
                          className="text-[#000000] hover:text-red-700 font-black p-0.5 cursor-pointer text-[14px]"
                          title="Excluir conta"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reset / Zerar dados panel */}
          <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between flex-wrap gap-2 bg-[#fcfcfc] p-3 border rounded-xs">
            <div>
              <div className="font-black text-[14px] text-black">Zerar Dados do Sistema</div>
              <div className="text-[12px] text-gray-600">Apaga todos os lançamentos e zera os saldos de todas as contas no banco de dados.</div>
            </div>
            {onResetDataToZero && (
              <button
                type="button"
                onClick={onResetDataToZero}
                className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded cursor-pointer"
              >
                🗑️ Zerar dados
              </button>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'categorias' && (
        <div className="space-y-3">
          <form onSubmit={handleCreateCategory} className="flex items-center gap-2 bg-[#f4f4f4] p-3 border border-[#b8b8b8]">
            <input
              type="text"
              placeholder="Nova Categoria..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="border border-[#888888] px-3 py-1.5 text-[14px] font-black text-[#000000] flex-1 bg-white"
            />
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as any)}
              className="border border-[#888888] px-3 py-1.5 text-[14px] font-black text-[#000000] bg-white"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <button
              type="submit"
              className="bg-[#5a8710] hover:bg-[#4d740c] text-white px-4 py-1.5 font-black text-[13.5px] rounded-xs cursor-pointer"
            >
              Adicionar
            </button>
          </form>

          <div className="border border-[#b8b8b8] bg-white max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
              {categories.map(cat => (
                <div key={cat.id} className="p-2.5 border border-[#cccccc] bg-[#fafafa] flex items-center justify-between group">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-black text-[#000000] truncate text-[14px]">{cat.name}</span>
                    <span className={`text-[11px] font-black px-1.5 py-0.5 rounded shrink-0 ${cat.type === 'receita' ? 'bg-green-100 text-green-950' : 'bg-red-100 text-red-950'}`}>
                      {cat.type}
                    </span>
                  </div>

                  {cat.name !== 'Sem Categoria' && cat.name !== 'Transferência' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditCategory(cat)}
                        className="text-[#000000] hover:text-[#5a8710] font-black p-0.5 cursor-pointer text-[13px]"
                        title="Editar categoria"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-[#000000] hover:text-red-700 font-black p-0.5 cursor-pointer text-[13px]"
                        title="Excluir categoria"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'regras' && (
        <div className="p-5 border-2 border-[#b8b8b8] bg-[#fafafa] text-center space-y-2">
          <ShieldCheck className="w-9 h-9 text-[#82af07] mx-auto" />
          <h4 className="font-black text-[14.5px] text-[#000000]">Regras de Categorização Automática</h4>
          <p className="text-[#000000] font-bold max-w-md mx-auto text-[12.5px]">
            As regras preenchem automaticamente a categoria e conta ao importar extratos bancários com base em palavras-chave da descrição.
          </p>
        </div>
      )}
    </div>
  );
};
