---
name: HidroG Space
description: Sistema moderno de gestão de orçamentos, pedidos, parcelas e produtos para Hidro G Bombas Submersas
colors:
  primary: "#0ea5e9"
  primary-hover: "#0284c7"
  primary-deep: "#0369a1"
  primary-subtle: "#f0f9ff"
  neutral-bg: "#f8fafc"
  neutral-card: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-border-subtle: "#f1f5f9"
  text-primary: "#0f172a"
  text-muted: "#64748b"
  success: "#16a34a"
  success-bg: "#dcfce7"
  danger: "#dc2626"
  danger-bg: "#fef2f2"
  warning: "#ca8a04"
  warning-bg: "#fef9c3"
  pago-bg: "#ecfdf5"
  pago-text: "#047857"
  pago-border: "#a7f3d0"
  avencer-bg: "#fef3c7"
  avencer-text: "#92400e"
  avencer-border: "#fcd34d"
  pendente-bg: "#eff6ff"
  pendente-text: "#1e40af"
  pendente-border: "#bfdbfe"
  vencido-bg: "#fef2f2"
  vencido-text: "#b91c1c"
  vencido-border: "#fecaca"
  protesto-bg: "#7f1d1d"
  protesto-text: "#ffffff"
  protesto-border: "#991b1b"
  estorno-bg: "#f3f4f6"
  estorno-text: "#4b5563"
  estorno-border: "#e5e7eb"
  icon-emerald: "#059669"
  icon-amber: "#d97706"
  icon-amber-bg: "#fffbeb"
  icon-amber-border: "#fde68a"
  icon-muted: "#94a3b8"
typography:
  fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
  xs: "0.75rem"
  sm: "0.875rem"
  base: "1rem"
  lg: "1.125rem"
  xl: "1.25rem"
  2xl: "1.5rem"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# HidroG Space — Design System

## Overview
O **HidroG Space** é o sistema de gestão operacional, orçamentos, emissão de pedidos e controle de parcelas da **Hidro G Bombas Submersas**. A interface adota os princípios de acabamento e craft do padrão **Impeccable**, oferecendo uma experiência limpa, funcional, moderna e com alta hierarquia de informação para desktop e dispositivos móveis.

A identidade visual transmite confiabilidade, precisão técnica e agilidade através de tons celestes/azuis (`#0ea5e9`), superfícies com profundidade delicada (glassmorphism translúcido no header e sombras multicamadas), contrastes acessíveis e suporte a numerais tabulares para cálculos financeiros exatos.

---

## Colors

### Cores de Marca (Brand)
- **Primary / Brand (`--brand`)**: `#0ea5e9` — Azul celeste enérgico, utilizado em ações primárias, links ativos e elementos focais.
- **Brand Hover (`--brand-600`)**: `#0284c7` — Tom mais escuro para transição de hover em botões primários.
- **Brand Deep (`--brand-700`)**: `#0369a1` — Utilizado para textos com destaque da marca garantindo contraste WCAG AAA.
- **Brand Subtle (`--brand-50`)**: `#f0f9ff` — Fundo suave para destaques, badges e linhas ativas/arrastadas em tabelas.

### Superfícies & Neutros
- **Background (`--bg`)**: `#f8fafc` (Slate 50) — Fundo de tela limpo, não cansativo à visão.
- **Card Surface (`--card`)**: `#ffffff` — Branco puro para cartões, formulários e modais.
- **Border Default (`--border`)**: `#e2e8f0` (Slate 200) — Delimitação sutil de campos e cartões.
- **Border Subtle (`--border-subtle`)**: `#f1f5f9` (Slate 100) — Divisórias internas e linhas de tabelas.
- **Text Primary (`--text`)**: `#0f172a` (Slate 900) — Contraste máximo legível para títulos e dados.
- **Text Muted (`--text-muted`)**: `#64748b` (Slate 500) — Labels, descrições secundárias e datas.

### Cores Semânticas de Status
- **Success**: `#16a34a` / `#22c55e` | Fundo: `#dcfce7` — Orçamentos aprovados, pagamentos quitados.
- **Warning**: `#ca8a04` | Fundo: `#fef9c3` — Pendente / Aguardando aprovação.
- **Danger**: `#dc2626` | Fundo: `#fef2f2` — Orçamento recusado, parcela vencida ou exclusões.
- **Info / Faturado**: `#2563eb` | Fundo: `#eff6ff` — Pedidos faturados ou convertidos.

---

## Typography

- **Fonte do Sistema**: `'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif`.
- **Renderização**: Suavização `-webkit-font-smoothing: antialiased` e `-moz-osx-font-smoothing: grayscale`.

### Escala de Tamanhos
| Token | Tamanho | Aplicação |
|---|---|---|
| `--text-xs` | `0.75rem` (12px) | Badges, tags de parcelas, datas, help text e labels de formulário |
| `--text-sm` | `0.875rem` (14px) | Textos secundários, itens de tabela, inputs compactos, descrições |
| `--text-base`| `1rem` (16px) | Corpo de texto principal, valores digitados, botões padrão |
| `--text-lg` | `1.125rem` (18px) | Subtítulos de seções, modais e resumos |
| `--text-xl` | `1.25rem` (20px) | Valores de totais, cabeçalhos de cartões |
| `--text-2xl`| `1.5rem` (24px) | Título principal de documento (Orçamento, Relatório, Dashboard) |

### Numerais Tabulares
Classes `.tabular-nums`, `.kpi-card`, `.table td` e `.badge-status` utilizam `font-variant-numeric: tabular-nums` para alinhamento uniforme de dígitos em valores monetários e datas.

---

## Layout

- **Header Superior**: Fixo com altura padrão `--header-h: 76px`, adaptando-se para `auto` no mobile com espaçamento extra para toques. O `body` compensa o header com `padding-top: var(--header-h)`.
- **Container Central (`.wrap`)**: Limite de largura de 1180px para máxima legibilidade de formulários sem esticar excessivamente em monitores ultra-wide.
- **Grid Responsivo**: Flexbox e CSS Grid integrados ao sistema de 12 colunas do Bootstrap com classes de espaçamento contínuo (`g-2`, `g-3`, `gap-3`).
- **Margens e Scrollbars**: `scrollbar-gutter: stable` impede saltos de layout ao abrir modais ou alternar entre páginas longas.

---

## Elevation & Depth

O sistema de profundidade evita sombras escuras artificiais ou bordas grossas unilaterais, adotando o modelo multicamadas com luz difusa:

- `--shadow-xs`: `0 1px 2px rgba(15, 23, 42, 0.04)` (Botões sutis, inputs no repouso).
- `--shadow-sm`: `0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)` (Cards em repouso).
- `--shadow`: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)` (Cards em foco ou dropdowns).
- `--shadow-md`: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)` (Hover de cartões, linhas arrastadas).
- `--shadow-lg`: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` (Modais e popovers centrais).

### Glassmorphism Translúcido
O header e os toolbars flutuantes utilizam:
```css
background: rgba(255, 255, 255, 0.92);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(226, 232, 240, 0.85);
```

---

## Shapes

- **Bordas Arredondadas (Border Radius)**:
  - `--radius-sm`: `8px` — Botões, inputs, tags, mini-badges.
  - `--radius`: `12px` — Cartões principais, modais, tabelas encapsuladas.
  - `999px` (Pill) — Badges de status, scrollbar thumbs e toggles rápidos.
- **Foco Acessível**: `:focus-visible` com anel contrastante de 2px `var(--brand)` e offset de 2px.
- **Seleção**: `::selection` com fundo `#bae6fd` e texto `#0369a1`.

---

## Components

### Botões (`.btn`)
- **Primário**: Fundo `--brand`, texto branco, sombra suave, transição de transform e background em `0.15s var(--ease-out)`.
- **Soft Secondary (`.btn-soft-secondary`)**: Fundo `--brand-50`, texto `--brand-700`, sem borda dura.
- **Botões Flutuantes / Ação**: Altura mínima de 38px (desktop) e 44px (mobile) para área de toque confortável.

### Cabeçalho de Seção (`.section-header`)
Substituiu a borda lateral abrupta (*side-tab*) por um pill elegante com background suave:
```css
.section-header {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--brand-700);
  background: var(--brand-50);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  margin-top: 14px;
  margin-bottom: 10px;
}
```

### Modais e Diálogos
- Entrada em escala suave com opacidade (`transform: scale(0.98)` para `scale(1)`).
- Sem curvas de efeito mola estridentes (*bounce-easing*); todas as transições utilizam curva exponencial:
  `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.

---

## Do's and Don'ts

### Do's:
- **Use sempre as variáveis de tokens**: use `var(--text-xs)`, `var(--text-sm)`, etc., em vez de valores arbitrários em `px` ou `rem`.
- **Formate dados monetários**: aplique `.tabular-nums` e utilize a função centralizada de formatação de moedas (`utils.js`).
- **Mantenha alinhamento de hierarquia**: garanta que títulos (`h1`, `h2`, `h3`) mantenham proporção de escala clara (ao menos 1.5x a 2x em relação ao texto secundário).
- **Mantenha foco acessível**: preserve `:focus-visible` em todos os elementos interativos.

### Don'ts:
- **Não use bounce easing**: evite `cubic-bezier(0.34, 1.56, ...)` ou animações elásticas que causam vibração visual.
- **Não use bordas unilaterais pesadas (side-tabs)**: evite `border-left: 3px solid var(--brand)` em cartões e títulos. Prefira backgrounds suaves ou badges estruturados.
- **Não use sombras duras/opacas**: evite `box-shadow: 0 4px 10px #00000030`. Use sempre a escala multicamadas `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
- **Não sobreponha texto no header fixo**: certifique-se de que novos layouts contenham a margem superior ou espaçamento adequado (`padding-top: var(--header-h)`).
