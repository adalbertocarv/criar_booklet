document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument, StandardFonts } = PDFLib;
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const mergeButton = document.getElementById('mergeButton');
    const downloadLink = document.getElementById('downloadLink');
    let selectedFile;

    // Eventos da zona de arrastar e soltar
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => fileInput.click());

    // Evento de mudança do input de arquivo
    fileInput.addEventListener('change', handleFileChange);

    // Evento do botão de mesclar
    mergeButton.addEventListener('click', handleMerge);

    // Função para lidar com o arrasto sobre a zona
    function handleDragOver(event) {
        event.preventDefault();
        dropZone.classList.add('dragover');
    }

    // Função para lidar com a saída do arrasto
    function handleDragLeave() {
        dropZone.classList.remove('dragover');
    }

    // Função para lidar com o drop de arquivos
    function handleDrop(event) {
        event.preventDefault();
        dropZone.classList.remove('dragover');
        selectedFile = event.dataTransfer.files[0];
        validateFile();
    }

    // Função para lidar com a mudança do arquivo selecionado
    function handleFileChange(event) {
        selectedFile = event.target.files[0];
        validateFile();
    }

    // Função para validar se o arquivo é um PDF
    function validateFile() {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            dropZone.textContent = selectedFile.name;
        } else {
            alert('Por favor, selecione um arquivo PDF.');
        }
    }

 // Função para criar uma página em branco com texto
async function createBlankPageWithText(pageNumber) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4 size in points
    const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);

    page.setFont(helveticaFont);
    page.setFontSize(12);
    page.drawText(`Página em Branco - Página ${pageNumber}`, {
        x: 200,
        y: 400,
    });

    return await doc.save();
}

// Função para ajustar o número de páginas para ser múltiplo de 8
async function adjustToMultipleOf8(pdfDoc) {
    const adjustedDoc = await PDFDocument.create();
    const pages = await adjustedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => adjustedDoc.addPage(page));

    // Adiciona páginas em branco até ser múltiplo de 8
    while (adjustedDoc.getPageCount() % 8 !== 0) {
        const blankPageBytes = await createBlankPageWithText(adjustedDoc.getPageCount() + 1);
        const blankDoc = await PDFDocument.load(blankPageBytes);
        const [blankPage] = await adjustedDoc.copyPages(blankDoc, [0]);
        adjustedDoc.addPage(blankPage);
    }

    return adjustedDoc;
}

// Função para dividir o PDF em duas metades
async function splitPDF(pdfDoc) {
    const adjustedDoc = await adjustToMultipleOf8(pdfDoc);
    const totalPages = adjustedDoc.getPageCount();
    const half = Math.floor(totalPages / 2);

    const doc1 = await PDFDocument.create();
    const doc2 = await PDFDocument.create();

    let left = 0;
    let right = totalPages - 1;
    let pageCounter = 0;

    // Cria o primeiro PDF seguindo a lógica personalizada
    while (pageCounter < half) {
        const [pageRight] = await doc1.copyPages(adjustedDoc, [right--]);
        doc1.addPage(pageRight);
        pageCounter++;

        if (pageCounter < half) {
            const [pageLeft] = await doc1.copyPages(adjustedDoc, [left++]);
            doc1.addPage(pageLeft);
            pageCounter++;
        }

        if (pageCounter < half) {
            const [pageLeft] = await doc1.copyPages(adjustedDoc, [left++]);
            doc1.addPage(pageLeft);
            pageCounter++;
        }

        if (pageCounter < half) {
            const [pageRight] = await doc1.copyPages(adjustedDoc, [right--]);
            doc1.addPage(pageRight);
            pageCounter++;
        }
    }

    // Cria o segundo PDF com as páginas restantes
    while (left <= right) {
        if (left <= right) {
            const [page] = await doc2.copyPages(adjustedDoc, [right]);
            doc2.addPage(page);
            right--;
        }
        if (left <= right) {
            const [page] = await doc2.copyPages(adjustedDoc, [left]);
            doc2.addPage(page);
            left++;
        }
        if (left <= right) {
            const [page] = await doc2.copyPages(adjustedDoc, [left]);
            doc2.addPage(page);
            left++;
        }
        if (left <= right) {
            const [page] = await doc2.copyPages(adjustedDoc, [right]);
            doc2.addPage(page);
            right--;
        }
    }

    return { doc1, doc2 };
}

    // Combinar metades em um único PDF
    async function combinePDFHalves(doc1, doc2) {
        const combinedDoc = await PDFDocument.create();
        const larguraA4 = 595.28;
        const alturaA4 = 841.89;
        const positions = [
            { x: 0, y: alturaA4 / 2 },
            { x: larguraA4 / 2, y: alturaA4 / 2 },
            { x: 0, y: 0 },
            { x: larguraA4 / 2, y: 0 }
        ];

        const totalPages = Math.max(doc1.getPageCount(), doc2.getPageCount());
        for (let i = 0; i < totalPages; i += 2) {
            const novaPagina = combinedDoc.addPage([larguraA4, alturaA4]);

            const paginasMetade1 = await combinedDoc.copyPages(doc1, [i, i + 1].filter(idx => idx < doc1.getPageCount()));
            const paginasMetade2 = await combinedDoc.copyPages(doc2, [i, i + 1].filter(idx => idx < doc2.getPageCount()));
            const paginas = [...paginasMetade1, ...paginasMetade2];

            for (let j = 0; j < paginas.length; j++) {
                const pos = positions[j];
                const embeddedPage = await combinedDoc.embedPage(paginas[j]);
                novaPagina.drawPage(embeddedPage, {
                    x: pos.x,
                    y: pos.y,
                    width: larguraA4 / 2,
                    height: alturaA4 / 2,
                });
            }
        }

        return combinedDoc;
    }

    // Evento do botão "Criar PDF"
    async function handleMerge() {
        if (!selectedFile) {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }

        try {
            const pdfBytes = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const { doc1, doc2 } = await splitPDF(pdfDoc);
            const combinedDoc = await combinePDFHalves(doc1, doc2);

            const finalBytes = await combinedDoc.save();
            prepareDownload(finalBytes);
        } catch (error) {
            console.error('Erro ao processar o PDF:', error);
            alert('Ocorreu um erro ao criar o mini livro PDF.');
        }
    }

    // Preparar download
    function prepareDownload(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        downloadLink.href = url;
        downloadLink.download = 'mini_livro.pdf';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Baixar Mini Livro PDF';
    }
});
