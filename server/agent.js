// Agent loop (filled in by Task 11). Kept as a module so the router can import it now.
export const llmProvider = () => (process.env.ANTHROPIC_API_KEY ? "anthropic" : process.env.GEMINI_API_KEY ? "gemini" : null);

export async function runAgent() {
  return { reply: "The assistant is not ready yet.", trace: [], actions: [] };
}
