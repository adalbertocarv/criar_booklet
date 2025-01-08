from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import io

def criar_pagina_em_branco_com_texto(numero_pagina):
    """
    Cria uma página em branco com texto indicando o número da página.
    
    :param numero_pagina: Número da página a ser exibido.
    :return: Bytes da página PDF com o texto.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setFont("Helvetica", 12)
    c.drawString(200, 400, f"Página em Branco - Página {numero_pagina}")
    c.save()
    buffer.seek(0)
    return buffer

def ajustar_para_multiplo_de_8(reader, total_paginas):
    """
    Ajusta o número de páginas para que seja múltiplo de 8, adicionando páginas em branco.
    
    :param reader: Objeto PdfReader do arquivo original.
    :param total_paginas: Total de páginas no arquivo original.
    :return: Objeto PdfReader ajustado.
    """
    writer_temp = PdfWriter()
    
    # Copiar todas as páginas do arquivo original
    for page in reader.pages:
        writer_temp.add_page(page)
    
    # Adicionar páginas em branco até o total ser múltiplo de 8
    while total_paginas % 8 != 0:
        total_paginas += 1
        nova_pagina = criar_pagina_em_branco_com_texto(total_paginas)
        nova_pagina_reader = PdfReader(nova_pagina)
        writer_temp.add_page(nova_pagina_reader.pages[0])
    
    # Salvar o PDF ajustado temporariamente
    temp_path = "temp_paginas_ajustado.pdf"
    with open(temp_path, "wb") as temp_file:
        writer_temp.write(temp_file)
    
    return PdfReader(temp_path)

def dividir_pdf(caminho_pdf, pdf_parte1, pdf_parte2):
    """
    Divide um PDF em dois PDFs, aplicando a lógica personalizada para o primeiro PDF.
    
    :param caminho_pdf: Caminho para o arquivo PDF original.
    :param pdf_parte1: Caminho para salvar o primeiro PDF.
    :param pdf_parte2: Caminho para salvar o segundo PDF.
    """
    try:
        # Ler o PDF original
        reader = PdfReader(caminho_pdf)
        total_paginas = len(reader.pages)

        # Ajustar para múltiplo de 8
        reader = ajustar_para_multiplo_de_8(reader, total_paginas)
        total_paginas = len(reader.pages)

        # Criar o primeiro PDF com a lógica personalizada
        writer1 = PdfWriter()
        writer2 = PdfWriter()

        left = 0
        right = total_paginas - 1
        metade = total_paginas // 2
        contador_paginas = 0

        # Criar o primeiro PDF com a lógica alternada
        while contador_paginas < metade:
            if contador_paginas < metade:
                writer1.add_page(reader.pages[right])  # Última página
                right -= 1
                contador_paginas += 1
            if contador_paginas < metade:
                writer1.add_page(reader.pages[left])   # Primeira página
                left += 1
                contador_paginas += 1
            if contador_paginas < metade:
                writer1.add_page(reader.pages[left])   # Segunda página
                left += 1
                contador_paginas += 1
            if contador_paginas < metade:
                writer1.add_page(reader.pages[right])  # Penúltima página
                right -= 1
                contador_paginas += 1

          # Lógica para o segundo PDF
        while left <= right:
            if left <= right:
                writer2.add_page(reader.pages[left])  # Página do lado esquerdo
                left += 1
            if left <= right:
                writer2.add_page(reader.pages[right])  # Página do lado direito
                right -= 1

        # Salvar os dois PDFs
        with open(pdf_parte1, "wb") as arquivo1:
            writer1.write(arquivo1)

        with open(pdf_parte2, "wb") as arquivo2:
            writer2.write(arquivo2)

        print(f"PDF dividido com sucesso!")
        print(f"Primeiro PDF salvo em: {pdf_parte1}")
        print(f"Segundo PDF salvo em: {pdf_parte2}")

    except Exception as e:
        print(f"Ocorreu um erro: {e}")

# Exemplo de uso
caminho_pdf = "javascript.pdf"
pdf_parte1 = "primeiro_pdf.pdf"
pdf_parte2 = "segundo_pdf.pdf"

dividir_pdf(caminho_pdf, pdf_parte1, pdf_parte2)
