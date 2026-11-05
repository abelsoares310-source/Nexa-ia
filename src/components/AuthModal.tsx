import React, { useState } from "react";
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Sparkles, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Flame,
  Award
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser 
} from "../utils/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSyncNow,
  isSyncing = false,
  lastSyncTime,
}) => {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      setSuccessMsg("Login realizado com sucesso via Google!");
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1200);
    } catch (err: any) {
      console.error("Erro no login com Google:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("A janela de login foi fechada antes de concluir.");
      } else if (err?.code === "auth/cancelled-popup-request") {
        setErrorMsg("Tentativa cancelada.");
      } else {
        setErrorMsg(err?.message || "Não foi possível autenticar com o Google. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("As senhas informadas não coincidem.");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(cleanEmail, password, name.trim() || undefined);
        setSuccessMsg("Conta criada com sucesso! Seu progresso agora está salvo na nuvem.");
      } else {
        await loginWithEmail(cleanEmail, password);
        setSuccessMsg("Login realizado com sucesso! Seus dados foram carregados.");
      }
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1300);
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setErrorMsg("Este e-mail já está cadastrado. Alterne para a aba 'Entrar'.");
      } else if (code === "auth/invalid-email") {
        setErrorMsg("O formato do e-mail é inválido.");
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setErrorMsg("E-mail ou senha incorretos.");
      } else if (code === "auth/weak-password") {
        setErrorMsg("A senha é muito fraca. Utilize pelo menos 6 caracteres.");
      } else {
        setErrorMsg(err?.message || "Ocorreu um erro ao processar. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setSuccessMsg("Você saiu da sua conta.");
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    } catch (err: any) {
      console.error("Erro ao sair:", err);
      setErrorMsg("Erro ao desconectar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {currentUser ? (
            /* Logged in state view */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                  <Cloud className="w-3.5 h-3.5 mr-1" />
                  Conta Conectada & Sincronizada
                </span>
                <h3 className="text-xl font-bold text-white">
                  {currentUser.displayName || "Estudante"}
                </h3>
                <p className="text-sm text-slate-400">{currentUser.email}</p>
              </div>

              {/* Cloud Sync Status Info */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Progresso na Nuvem:</span>
                  </span>
                  <span className="font-semibold text-emerald-400">Ativo</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Última sincronização:</span>
                  <span className="text-slate-200 font-mono">
                    {lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Agora mesmo"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                  Seu cronograma, rotina, flashcards, ofensivas e notas são salvos automaticamente e lidos em qualquer navegador ou celular.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                {onSyncNow && (
                  <button
                    type="button"
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Sincronizando..." : "Sincronizar Progresso Agora"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-rose-300 hover:text-rose-200 text-sm font-medium transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated: Register / Login */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto text-slate-950 font-bold mb-2 shadow-lg shadow-emerald-500/20">
                  <Cloud className="w-6 h-6 text-slate-950" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {mode === "register" ? "Criar Minha Conta de Estudos" : "Acessar Minha Conta"}
                </h3>
                <p className="text-xs text-slate-400">
                  Seus planos, rotinas, flashcards e diagnósticos salvos e acessíveis em qualquer lugar.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => { setMode("register"); resetForm(); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    mode === "register"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Criar Conta
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("login"); resetForm(); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    mode === "login"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Já tenho Conta
                </button>
              </div>

              {/* Quick Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Entrar com o Google</span>
              </button>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-slate-800" />
                <span className="px-3 text-[11px] text-slate-500 uppercase tracking-wider">ou com e-mail</span>
                <div className="flex-1 border-t border-slate-800" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Seu Nome ou Apelido
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Ana Clara"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Senha {mode === "register" && <span className="text-slate-500 text-[10px]">(mínimo 6 caracteres)</span>}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Error & Success Messages */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <span>{mode === "register" ? "Criar Conta & Salvar Progresso" : "Entrar na Minha Conta"}</span>
                  )}
                </button>
              </form>

              {/* Security & Benefits Badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-slate-800/50 border border-slate-800">
                  <Smartphone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Acesse do celular ou PC</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-slate-800/50 border border-slate-800">
                  <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Backup automático</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start space-x-2 text-[11px] text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Dados Reais:</strong> Ao criar sua conta ou entrar, todos os números e registros de exemplo são apagados, iniciando seu painel com estatísticas 100% autênticas!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
