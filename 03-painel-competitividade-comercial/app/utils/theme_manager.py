# theme_manager.py - Tema fixo (claro)

import streamlit as st
import os

CSS_PATH = os.path.join("assets", "custom_style.css")


def init_theme():
    """Mantém compatibilidade — tema sempre claro."""
    st.session_state["theme"] = "claro"


def toggle_theme():
    """Sem efeito — modo escuro removido."""
    pass


def inject_theme_css():
    """Injeta variáveis CSS do tema claro e o arquivo de estilo base."""
    st.session_state["theme"] = "claro"

    root_vars = """
    :root {
        --bg-page:         #F0F2F5;
        --bg-card:         #FFFFFF;
        --bg-header:       #FFFFFF;
        --bg-input:        #FFFFFF;
        --text-primary:    #1A1D23;
        --text-secondary:  #5A6478;
        --text-muted:      #8B95A5;
        --border:          #DDE1E9;
        --border-focus:    #2D2E96;
        --shadow-sm:       0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
        --shadow-md:       0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
        --shadow-lg:       0 12px 32px rgba(0,0,0,0.12);
        --azul-sj:         #2D2E96;
        --vermelho-sj:     #C81419;
        --verde-sj:        #0AA35B;
        --laranja-sj:      #FF9326;
        --azul-claro-sj:   #00B1F2;
        --kpi-alerta-bg:   #FFF0F0;
        --kpi-alerta-txt:  #C81419;
        --kpi-oport-bg:    #FFF8EE;
        --kpi-oport-txt:   #D97706;
        --kpi-comp-bg:     #EDFAF3;
        --kpi-comp-txt:    #0AA35B;
    }
    """

    css_content = ""
    if os.path.exists(CSS_PATH):
        with open(CSS_PATH, "r", encoding="utf-8") as f:
            css_content = f.read()

    st.markdown(f"<style>{root_vars}\n{css_content}</style>", unsafe_allow_html=True)
