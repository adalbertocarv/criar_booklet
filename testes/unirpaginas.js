const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function combinarMetadesEm4PaginasPorFolha(caminhoMetade1, caminhoMetade2, caminhoSaida) {
    try {
        // Ler os PDFs das duas metades
        const metade1Bytes = fs.readFileSync(caminhoMetade1);
        const metade2Bytes = fs.readFileSync(caminhoMetade2);

        const metade1Doc = await PDFDocument.load(metade1Bytes);
        const metade2Doc = await PDFDocument.load(metade2Bytes);

        // Certifique-se de que ambos têm o mesmo número de páginas
        const totalPaginasMetade1 = metade1Doc.getPageCount();
        const totalPaginasMetade2 = metade2Doc.getPageCount();

        if (totalPaginasMetade1 !== totalPaginasMetade2) {
            throw new Error("Os PDFs das metades devem ter o mesmo número de páginas.");
        }

        // Criar um novo PDF para o arquivo combinado
        const pdfCombinado = await PDFDocument.create();

        // Dimensões da página A4
        const larguraA4 = 595.28; // Largura A4 em pontos
        const alturaA4 = 841.89; // Altura A4 em pontos

        // Iterar pelas páginas e combinar 4 em cada folha
        for (let i = 0; i < totalPaginasMetade1; i += 2) {
            const novaPagina = pdfCombinado.addPage([larguraA4, alturaA4]);

            const positions = [
                { x: 0, y: alturaA4 / 2 },       // Superior esquerdo
                { x: larguraA4 / 2, y: alturaA4 / 2 }, // Superior direito
                { x: 0, y: 0 },                // Inferior esquerdo
                { x: larguraA4 / 2, y: 0 }     // Inferior direito
            ];

            // Copiar duas páginas da metade 1 e duas da metade 2
            const paginasMetade1 = await pdfCombinado.copyPages(metade1Doc, [i, i + 1].filter(idx => idx < totalPaginasMetade1));
            const paginasMetade2 = await pdfCombinado.copyPages(metade2Doc, [i, i + 1].filter(idx => idx < totalPaginasMetade2));

            const paginas = [...paginasMetade1, ...paginasMetade2];

            for (let j = 0; j < paginas.length; j++) {
                const pos = positions[j];
                const paginaIncorporada = await pdfCombinado.embedPage(paginas[j]);
                novaPagina.drawPage(paginaIncorporada, {
                    x: pos.x,
                    y: pos.y,
                    width: larguraA4 / 2,
                    height: alturaA4 / 2
                });
            }
        }

        // Salvar o PDF combinado
        const pdfBytes = await pdfCombinado.save();
        fs.writeFileSync(caminhoSaida, pdfBytes);
        console.log(`PDF combinado salvo em: ${caminhoSaida}`);
    } catch (error) {
        console.error("Erro ao combinar páginas:", error);
    }
}

// Exemplo de uso
const caminhoMetade1 = 'first_pdf.pdf';
const caminhoMetade2 = 'second_pdf.pdf';
const caminhoSaida = 'pdf_combinado.pdf';

combinarMetadesEm4PaginasPorFolha(caminhoMetade1, caminhoMetade2, caminhoSaida);
