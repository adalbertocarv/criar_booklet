from flask import Flask, request, render_template, send_file
from PyPDF2 import PdfReader, PdfWriter
import io

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return "No file uploaded", 400

    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400

    try:
        # Ler o PDF recebido
        pdf_reader = PdfReader(file)
        pdf_writer = PdfWriter()

        # Processar o PDF (adicionando uma página em branco como exemplo)
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)

        pdf_writer.add_blank_page()

        # Salvar o PDF processado em memória
        output = io.BytesIO()
        pdf_writer.write(output)
        output.seek(0)

        return send_file(output, download_name="processed.pdf", as_attachment=True)
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True)
