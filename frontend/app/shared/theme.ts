export const THEME_STORAGE_KEY = "vozero-theme";

export const themeScript = `
  (() => {
    let theme;
    try {
      theme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    } catch {}
    document.documentElement.dataset.theme = theme === "light" || theme === "dark"
      ? theme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  })();
`;
