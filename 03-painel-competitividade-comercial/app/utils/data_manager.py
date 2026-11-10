# data_manager.py - Gerenciador de Carga e Escrita de Dados

import pandas as pd
import numpy as np
import os
import shutil
from datetime import datetime

# Caminhos padrão da aplicação
ROOT_DIR = os.getcwd()
DATA_DIR = os.path.join(ROOT_DIR, "data")
ROOT_DB_FILE = os.path.join(ROOT_DIR, "Base Preço por Comprador.xlsx")
DEST_DB_FILE = os.path.join(DATA_DIR, "Base Preço por Comprador.xlsx")

def ensure_data_folder():
    """Garante que a pasta data/ existe e copia a base inicial do root para lá se necessário."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DEST_DB_FILE):
        if os.path.exists(ROOT_DB_FILE):
            shutil.copy2(ROOT_DB_FILE, DEST_DB_FILE)
            print(f"Base de dados inicial copiada para {DEST_DB_FILE}")
        else:
            print("AVISO: Base de dados inicial não encontrada no root.")

def get_db_metadata():
    """Retorna metadados da planilha ativa (data de modificação, tamanho e nome)."""
    ensure_data_folder()
    if os.path.exists(DEST_DB_FILE):
        stat = os.stat(DEST_DB_FILE)
        mod_time = datetime.fromtimestamp(stat.st_mtime)
        size_mb = stat.st_size / (1024 * 1024)
        return {
            "exists": True,
            "filename": os.path.basename(DEST_DB_FILE),
            "last_update": mod_time.strftime("%d/%m/%Y %H:%M:%S"),
            "size_mb": f"{size_mb:.2f} MB"
        }
    return {
        "exists": False,
        "filename": "Nenhum arquivo carregado",
        "last_update": "Sem registro",
        "size_mb": "0 MB"
    }

def clean_code_column(val):
    """Converte ID ou Código de Barras numérico para string limpa, sem decimais .0 e sem notação científica."""
    if pd.isnull(val):
        return ""
    
    val_str = str(val).strip()
    # Remove sufixo decimal se for ponto flutuante
    if val_str.endswith(".0"):
        val_str = val_str[:-2]
        
    # Lida com notação científica (caso Excel salve números muito grandes como 7.896e12)
    if "e" in val_str.lower() or "+" in val_str:
        try:
            val_float = float(val)
            val_str = str(int(val_float))
        except ValueError:
            pass
            
    return val_str

def load_data_from_excel():
    """
    Carrega a base do Excel, realiza o processamento e o enriquecimento de EAN,
    e retorna o DataFrame completo e higienizado.
    """
    ensure_data_folder()
    if not os.path.exists(DEST_DB_FILE):
        raise FileNotFoundError(f"Base de dados não encontrada em {DEST_DB_FILE}")

    # Inicializa ExcelFile para extrair nomes das planilhas dinamicamente (evitando quebras de acentuação)
    # Inicializa ExcelFile para extrair nomes das planilhas dinamicamente (evitando quebras de acentuação)
    with open(DEST_DB_FILE, "rb") as f:
        with pd.ExcelFile(f) as xl:
            sheet_names = xl.sheet_names
            
            if len(sheet_names) < 2:
                raise ValueError("A base Excel deve conter pelo menos duas planilhas ('Base Dashboard' e 'Posição de Estoque').")

            # 1. Carrega a planilha consolidada (sempre na primeira posição, header na linha 1)
            df_dash = pd.read_excel(xl, sheet_name=sheet_names[0], header=1)
            df_dash.columns = df_dash.columns.str.strip()
            
            # 2. Carrega a planilha de cadastro para extrair o código de barras (segunda posição)
            df_estq = pd.read_excel(xl, sheet_name=sheet_names[1])
            df_estq.columns = df_estq.columns.str.strip()
            
            # Leitura da planilha PriceGap se ela existir
            df_pg = None
            if 'PriceGap' in sheet_names:
                try:
                    df_pg = pd.read_excel(xl, sheet_name='PriceGap')
                    df_pg.columns = df_pg.columns.str.strip()
                except Exception as e:
                    print(f"Aviso: Erro ao ler PriceGap - {e}")
        
    # Garante que os campos de chave de join existam
    if 'Produto_ID' not in df_dash.columns:
        raise KeyError("A coluna 'Produto_ID' não foi encontrada na planilha principal.")
    if 'Produto_ID' not in df_estq.columns:
        raise KeyError("A coluna 'Produto_ID' não foi encontrada na planilha de Posição de Estoque.")

    # 3. Limpa chaves de join antes de cruzar
    df_dash['Produto_ID_Clean'] = df_dash['Produto_ID'].apply(clean_code_column)
    df_estq['Produto_ID_Clean'] = df_estq['Produto_ID'].apply(clean_code_column)

    # Identifica a coluna de código de barras (geralmente 'Cod. Barras' ou 'EAN')
    col_barras = None
    for col in df_estq.columns:
        if col.lower() in ['cod. barras', 'cod_barras', 'ean', 'codigo_barras', 'codigo de barras']:
            col_barras = col
            break
            
    if col_barras is None:
        # Fallback caso não ache
        df_dash['EAN'] = ""
    else:
        # Filtra sub-tabela de estoque para fazer o join limpo
        df_estq_sub = df_estq[['Produto_ID_Clean', col_barras]].drop_duplicates(subset=['Produto_ID_Clean'])
        
        # Faz o cruzamento
        df_dash = pd.merge(df_dash, df_estq_sub, on='Produto_ID_Clean', how='left')
        df_dash.rename(columns={col_barras: 'EAN'}, inplace=True)

    # Remove coluna auxiliar de join
    df_dash.drop(columns=['Produto_ID_Clean'], inplace=True, errors='ignore')

    # Join com PriceGap para trazer as colunas Gerenciais (Árvore do Digital) se não existirem no df_dash
    has_gerenciais = all(c in df_dash.columns for c in ['Gerencial 1', 'Gerencial 2', 'Gerencial 3'])
    if not has_gerenciais and df_pg is not None:
        try:
            if 'Desc_Produto' in df_pg.columns:
                cols_to_keep = ['Desc_Produto']
                rename_dict = {}
                if 'Gerencial 1' not in df_dash.columns and 'Gerencial 1' in df_pg.columns: 
                    cols_to_keep.append('Gerencial 1')
                if 'Gerencial 2' not in df_dash.columns and 'Grupo 2' in df_pg.columns: 
                    cols_to_keep.append('Grupo 2')
                    rename_dict['Grupo 2'] = 'Gerencial 2'
                if 'Gerencial 3' not in df_dash.columns and 'Grupo 3' in df_pg.columns: 
                    cols_to_keep.append('Grupo 3')
                    rename_dict['Grupo 3'] = 'Gerencial 3'
                
                if len(cols_to_keep) > 1:
                    df_pg_sub = df_pg[cols_to_keep].drop_duplicates(subset=['Desc_Produto'])
                    if rename_dict:
                        df_pg_sub.rename(columns=rename_dict, inplace=True)
                    
                    df_dash['join_desc'] = df_dash['Desc_Produto'].astype(str).str.strip().str.upper()
                    df_pg_sub['join_desc'] = df_pg_sub['Desc_Produto'].astype(str).str.strip().str.upper()
                    df_pg_sub.drop(columns=['Desc_Produto'], inplace=True)
                    
                    df_dash = pd.merge(df_dash, df_pg_sub, on='join_desc', how='left')
                    df_dash.drop(columns=['join_desc'], inplace=True)
        except Exception as e:
            print(f"Aviso: Erro ao processar PriceGap - {e}")

    # 4. Higienização Geral dos Dados
    # IDs e EANs formatados como texto limpo
    df_dash['Produto_ID'] = df_dash['Produto_ID'].apply(clean_code_column)
    df_dash['EAN'] = df_dash['EAN'].apply(clean_code_column)

    # Coerção de tipos numéricos importantes
    numeric_cols = [
        'Preço Regular SJ', 'Preço Atual SJ', 'Preço Médio Panvel', 'Preço Médio por Raia',
        'Meta Ecommerce', 'Realizado D-1', 'Desvio', '% Crescimento', '$ Crescimento', '% Evolução', '$ Evolução'
    ]
    for col in numeric_cols:
        if col in df_dash.columns:
            df_dash[col] = pd.to_numeric(df_dash[col], errors='coerce').fillna(0.0)

    # Lida com percentuais de GAP que possam vir como texto
    gap_cols = ['GAP % Panvel', 'GAP % Raia']
    for col in gap_cols:
        if col in df_dash.columns:
            df_dash[col] = pd.to_numeric(df_dash[col], errors='coerce').fillna(0.0)

    # Higienização de strings para filtros
    str_cols = ['Desc_Grupo', 'Desc_Subgrupo', 'Desc_Linha', 'Laboratorio', 'Desc_Produto', 'Descontinuado', 'Comprador', 'Gerencial 1', 'Gerencial 2', 'Gerencial 3']
    for col in str_cols:
        if col in df_dash.columns:
            df_dash[col] = df_dash[col].astype(str).str.strip()
            # Substitui NaNs ou vazios por "N/D"
            df_dash[col] = df_dash[col].replace({'nan': 'N/D', 'None': 'N/D', '': 'N/D'})
            
    return df_dash

def save_uploaded_excel(uploaded_file):
    """
    Substitui a base física anterior pelo arquivo Excel carregado pelo usuário.
    Retorna True se a operação foi bem sucedida.
    """
    ensure_data_folder()
    
    # Valida se o arquivo carregado é realmente um Excel
    if not (uploaded_file.name.endswith('.xlsx') or uploaded_file.name.endswith('.xls')):
        raise ValueError("O formato do arquivo enviado deve ser Excel (.xlsx ou .xls)")
        
    # Grava o arquivo temporariamente e faz um teste de leitura estrutural antes de substituir
    temp_path = os.path.join(DATA_DIR, "temp_upload.xlsx")
    with open(temp_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
        
    try:
        # Testa a estrutura do arquivo temporário
        with open(temp_path, "rb") as f:
            with pd.ExcelFile(f) as xl:
                if len(xl.sheet_names) < 2:
                    raise ValueError("O arquivo enviado não possui as planilhas mínimas necessárias.")
                
                # Testa leitura básica
                pd.read_excel(xl, sheet_name=xl.sheet_names[0], header=1, nrows=5)
                pd.read_excel(xl, sheet_name=xl.sheet_names[1], nrows=5)
        
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        raise ValueError(f"Estrutura do Excel inválida: {str(e)}")
        
    # Se passou nos testes, substitui o arquivo definitivo
    if os.path.exists(DEST_DB_FILE):
        # Cria um backup do arquivo atual antes de deletar
        backup_path = DEST_DB_FILE + ".bak"
        if os.path.exists(backup_path):
            os.remove(backup_path)
        os.rename(DEST_DB_FILE, backup_path)
        
    shutil.move(temp_path, DEST_DB_FILE)
    
    # Remove arquivo de backup se tudo deu certo
    backup_path = DEST_DB_FILE + ".bak"
    if os.path.exists(backup_path):
        os.remove(backup_path)
        
    return True
