document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
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

    // Função para mesclar PDFs
    async function handleMerge() {
        if (!selectedFile) {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const existingPdfBytes = new Uint8Array(event.target.result);
                const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                const outputPdfDoc = await PDFLib.PDFDocument.create();
                let totalPages = pdfDoc.getPageCount();

                const sequence = generateSequence(totalPages);
                await embedPages(pdfDoc, outputPdfDoc, sequence);

                // Chamar a função para excluir metade das páginas
                removeSecondHalf(outputPdfDoc);

                const pdfBytes = await outputPdfDoc.save();
                prepareDownload(pdfBytes);
            } catch (error) {
                alert('Ocorreu um erro ao processar o PDF: ' + error.message);
            }
        };

        reader.readAsArrayBuffer(selectedFile);
    }

    // Função para embutir páginas no novo documento PDF
    async function embedPages(pdfDoc, outputPdfDoc, sequence) {
        const totalPages = pdfDoc.getPageCount();
        const embeddedPages = await Promise.all(sequence.map(async (pageIndex) => {
            if (pageIndex <= totalPages) {
                const [page] = await pdfDoc.copyPages(pdfDoc, [pageIndex - 1]);
                return await outputPdfDoc.embedPage(page);
            }
            return null;
        }));

        for (let i = 0; i < embeddedPages.length; i += 4) {
            const newPage = outputPdfDoc.addPage([595.28, 841.89]); // A4 tamanho em pontos [width, height]
            const positions = [
                { x: 0, y: 420.945 },
                { x: 297.64, y: 420.945 },
                { x: 0, y: 0 },
                { x: 297.64, y: 0 }
            ];

            for (let j = 0; j < 4 && i + j < embeddedPages.length; j++) {
                const pos = positions[j];
                const embeddedPage = embeddedPages[i + j];
                if (embeddedPage) {
                    newPage.drawPage(embeddedPage, { x: pos.x, y: pos.y, width: 297.64, height: 420.945 });
                    console.log(`Folha ${Math.floor(i / 4) + 1}, Posição ${j + 1}: Página ${sequence[i + j]}`);
                }
            }
        }
    }

    // Função para preparar o download do arquivo PDF
    function prepareDownload(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = selectedFile.name.replace('.pdf', '') + '_mini_livro.pdf';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Baixar booklet PDF';
    }

    // Função para gerar a sequência de páginas
    function generateSequence(totalPages) {
        let sequence = [];
        let evenPages = [];
        let oddPages = [];

        // Adiciona as páginas pares e ímpares em suas respectivas listas
        for (let i = 1; i <= totalPages; i++) {
            if (i % 2 === 0) {
                evenPages.push(i);
            } else {
                oddPages.push(i);
            }
        }

        // Organizar as páginas em um livreto no padrão [2, 7, 4, 5], [8, 1, 6, 3]
        let numFolhas = totalPages / 4;

        for (let i = 0; i < numFolhas; i++) {
            // Frente da folha
            let frenteEsquerdaPar = evenPages.shift();  // Próxima página par
            let frenteDireitaImpar = oddPages.pop();    // Maior página ímpar restante
            let frenteDireitaPar = evenPages.shift();   // Próxima página par
            let frenteEsquerdaImpar = oddPages.pop();   // Maior página ímpar restante

            // Verso da folha
            let versoEsquerdaPar = evenPages.pop();     // Última página par
            let versoDireitaImpar = oddPages.shift();   // Próxima menor página ímpar
            let versoDireitaPar = evenPages.pop();      // Última página par
            let versoEsquerdaImpar = oddPages.shift();  // Próxima menor página ímpar

            // Adiciona a folha organizada
            sequence.push(frenteEsquerdaPar, frenteDireitaImpar, frenteDireitaPar, frenteEsquerdaImpar);
            sequence.push(versoEsquerdaPar, versoDireitaImpar, versoDireitaPar, versoEsquerdaImpar);
        }
        return sequence;
    }

    // Função para remover a segunda metade do PDF
    function removeSecondHalf(outputPdfDoc) {
        const totalPages = outputPdfDoc.getPageCount();
        const half = Math.floor(totalPages / 2);

        // Remove as páginas da metade para o final
        for (let i = totalPages - 1; i >= half; i--) {
            outputPdfDoc.removePage(i);
        }
    }
});
