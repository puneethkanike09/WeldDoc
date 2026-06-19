/** Runs before paint on admin routes to avoid a light flash when dark mode is saved. */
export function AppThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("welddoc-theme");var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.setAttribute("data-app-theme","dark");}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
