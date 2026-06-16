// Mapeia mensagens técnicas do Supabase Auth para mensagens amigáveis em PT-BR.
// Use sempre que exibir erro vindo de supabase.auth.* ao usuário final.

const MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/invalid email/i, "E-mail inválido."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar."],
  [/user already registered|already.*exists/i, "Já existe uma conta com este e-mail."],
  [/password should be at least (\d+)/i, "A senha deve ter pelo menos $1 caracteres."],
  [/weak password/i, "Senha muito fraca. Use letras, números e ao menos 8 caracteres."],
  [/over.*rate limit|too many requests/i, "Muitas tentativas. Tente novamente em alguns minutos."],
  [/network|fetch|failed to fetch/i, "Sem conexão. Verifique sua internet e tente novamente."],
  [/jwt|token.*expired|session.*expired/i, "Sessão expirada. Entre novamente."],
  [/unauthorized|forbidden/i, "Você não tem permissão para esta ação."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
];

export function friendlyAuthError(error: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  const raw =
    error instanceof Error ? error.message :
    typeof error === "string" ? error :
    error && typeof error === "object" && "message" in error ? String((error as { message?: unknown }).message ?? "") :
    "";
  for (const [re, msg] of MAP) {
    if (re.test(raw)) return msg.replace(/\$(\d+)/g, (_, i) => raw.match(re)?.[Number(i)] ?? "");
  }
  return fallback;
}