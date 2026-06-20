export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-[10px] border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember"
    >
      {message}
    </div>
  );
}
