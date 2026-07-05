"use client";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
      className="text-sm text-zinc-400 hover:text-white transition-colors"
    >
      Salir
    </button>
  );
}
