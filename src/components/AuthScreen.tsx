import React, { FormEvent, useState } from 'react';
import { Logo } from './Logo';
import { AuthResponse, FinanceData, login, register } from '../lib/api';
import { loginWithGoogle, loadUserFinanceData, saveUserFinanceData } from '../lib/firebase';

interface AuthScreenProps {
  initialData: FinanceData;
  initialError?: string;
  onAuthenticated: (response: AuthResponse) => void;
  onClose?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialData,
  initialError,
  onAuthenticated,
  onClose,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleAuth = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle();
      let data = await loadUserFinanceData(user.uid);
      if (!data) {
        data = initialData;
        await saveUserFinanceData(user.uid, user.email ?? '', initialData);
      }
      onAuthenticated({
        token: `fb_${user.uid}`,
        user: { email: user.email ?? '' },
        data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar com Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response =
        mode === 'register'
          ? await register(email, password, initialData)
          : await login(email, password);
      onAuthenticated(response);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível concluir a solicitação.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-4 font-sans">
      <section className="w-full max-w-md bg-white border border-[#b8b8b8] shadow-sm relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-black text-sm cursor-pointer"
            title="Voltar ao sistema"
          >
            ✕
          </button>
        )}
        <header className="bg-[#82af07] px-6 py-5 flex justify-center">
          <div className="bg-white rounded-sm px-4 py-2">
            <Logo />
          </div>
        </header>

        <div className="p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-black">
              {mode === 'login' ? 'Entrar na sua conta' : 'Criar sua conta'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Seus dados financeiros ficam salvos com segurança na nuvem (Firestore).
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-2.5 px-4 font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Entrar com o Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold uppercase text-gray-500">ou com e-mail</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-black">
              E-mail
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full border border-gray-400 px-3 py-2 font-normal outline-none focus:border-[#82af07]"
              />
            </label>

            <label className="block text-sm font-semibold text-black">
              Senha
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={10}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full border border-gray-400 px-3 py-2 font-normal outline-none focus:border-[#82af07]"
              />
              {mode === 'register' && (
                <span className="mt-1 block font-normal text-xs text-gray-600">
                  Use pelo menos 10 caracteres.
                </span>
              )}
            </label>

            {error && (
              <p role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#82af07] px-4 py-2.5 font-bold text-white hover:bg-[#6e9406] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting
                ? 'Aguarde...'
                : mode === 'login'
                  ? 'Entrar com E-mail'
                  : 'Criar conta com E-mail'}
            </button>

            <p className="text-center text-sm text-gray-700">
              {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="font-bold text-[#527800] underline"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>

            <div className="pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  onAuthenticated({
                    token: 'local_julio',
                    user: { email: 'julio@cbcenergiasrenovaveis.com' },
                    data: initialData,
                  });
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded text-sm transition-colors cursor-pointer"
              >
                Acessar Sistema Diretamente (Sem Login) →
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};
