'use client';
import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const PdfViewer = ({ fileUrl }: { fileUrl: string }) => {
    const [file, setFile] = useState<{ data: Uint8Array } | null>(null);
    const [numPages, setNumPages] = useState<number>(0);

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
    };

    if (!file) return <p>Loading PDF...</p>;

    return (
        <div className='flex flex-1 flex-col items-center justify-center gap-4 w-full'>
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                {Array.from({ length: numPages }, (_, index) => (
                    <div key={index} className=' bg-white text-black border-[1px] border-gray-400 mt-4 w-full max-w-full'>
                        <Page
                            pageNumber={index + 1}
                            width={Math.min(800)}
                            loading={<div>Loading page {index + 1}...</div>}
                        />
                    </div>
                ))}
            </Document>
        </div>
    );
};