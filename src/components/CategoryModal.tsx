import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { Trash2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  onSaveCategory: (categoryData: {
    id?: string;
    name: string;
    type: 'despesa' | 'receita';
    parentCategoryName?: string;
  }) => void;
  onDeleteCategory?: (id: string) => void;
  allCategories: Category[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSaveCategory,
  onDeleteCategory,
  allCategories,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'despesa' | 'receita'>('despesa');
  const [parentCategory, setParentCategory] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setFormError('');
    setShowConfirmDelete(false);
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setParentCategory('');
    } else {
      setName('');
      setType('despesa');
      setParentCategory('');
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Informe o nome da categoria.');
      return;
    }
    onSaveCategory({
      id: categoryToEdit?.id,
      name: name.trim(),
      type,
      parentCategoryName: parentCategory || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!categoryToEdit || !onDeleteCategory) return;
    onDeleteCategory(categoryToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-[#555555] shadow-2xl w-full max-w-[470px] text-[14.5px] text-[#000000] rounded-xs font-sans">
        {/* Title Bar */}
        <div className="bg-[#eeeeee] border-b border-[#cccccc] px-4 py-2.5 flex items-center justify-between">
          <span className="font-black text-[15.5px] text-[#000000]">
            {categoryToEdit ? `Editar Categoria: ${categoryToEdit.name}` : 'Nova Categoria'}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center border border-[#888] bg-white hover:bg-gray-100 text-[13px] font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4.5 space-y-4">
          <div className="space-y-1">
            <label className="font-black text-[#000000] text-[13.5px]">Nome da Categoria:</label>
            <input
              type="text"
              placeholder="Ex: Farmácia, Alimentação, Cursos..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#888888] text-[14px] font-bold text-[#000000] focus:outline-none focus:border-[#73a000] bg-white"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-black text-[#000000] text-[13.5px]">Tipo:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-[#888888] text-[14px] font-bold text-[#000000] focus:outline-none bg-white cursor-pointer"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>

          {!categoryToEdit && (
            <div className="space-y-1">
              <label className="font-black text-[#000000] text-[13.5px]">
                Subcategoria de (Opcional):
              </label>
              <select
                value={parentCategory}
                onChange={(e) => setParentCategory(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#888888] text-[14px] font-bold text-[#000000] focus:outline-none bg-white cursor-pointer"
              >
                <option value="">Nenhuma (Categoria Principal)</option>
                {allCategories
                  .filter((c) => c.name !== 'Sem Categoria' && c.name !== 'Transferência')
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {formError && (
            <div className="p-2.5 bg-red-100 border border-red-400 text-red-800 text-[13px] font-bold rounded-xs">
              ⚠️ {formError}
            </div>
          )}

          {showConfirmDelete && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xs flex items-center justify-between">
              <span className="text-red-900 font-bold text-[13px]">Excluir a categoria "{categoryToEdit?.name}"?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs font-bold border border-gray-400 bg-white cursor-pointer"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#cccccc]">
            {categoryToEdit && onDeleteCategory ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-black border border-red-300 rounded-xs text-[13px] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-[#888] bg-gradient-to-b from-[#fff] to-[#e8e8e8] text-[#000000] font-black rounded-xs cursor-pointer text-[13px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-[#5a8710] hover:bg-[#4d740c] text-white font-black rounded-xs border border-[#446609] cursor-pointer text-[13px] shadow-xs"
              >
                {categoryToEdit ? 'Salvar' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
