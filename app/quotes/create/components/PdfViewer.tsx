'use client';
import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const PdfViewer = ({ fileUrl }: { fileUrl: string }) => {
    const [file, setFile] = useState<{ data: Uint8Array } | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        let mounted = true;

        fetch(fileUrl)
            .then(res => res.arrayBuffer())
            .then(buffer => {
                if (mounted) setFile({ data: new Uint8Array(buffer) });
            })
            .catch(err => console.error('Error loading PDF:', err));

        return () => { mounted = false; };
    }, [fileUrl]);

    const onDocumentLoadSuccess = (pdf: any) => {
        setNumPages(pdf.numPages);
        setCurrentPage(1);
    };

    const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const nextPage = () => setCurrentPage((p) => Math.min(p + 1, numPages));

    if (!file) return <p>Loading PDF...</p>;

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="flex justify-between items-center mb-2 w-full max-w-[820px]">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-black text-white'}`}
                >
                    ← Prev
                </button>

                <span className="text-sm font-medium">
                    Page {currentPage} of {numPages}
                </span>

                <button
                    onClick={nextPage}
                    disabled={currentPage === numPages}
                    className={`px-3 py-1 rounded ${currentPage === numPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-black text-white'}`}
                >
                    Next →
                </button>
            </div>

            <div className="bg-white text-black border border-gray-400 w-full max-w-[820px] flex justify-center">
                <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                    <Page
                        pageNumber={currentPage}
                        width={800}
                        loading={<div>Loading page {currentPage}...</div>}
                    />
                </Document>
            </div>
        </div>
    );
};
