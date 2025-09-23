'use client';
import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const PdfViewer = ({ fileUrl }: { fileUrl: string }) => {
    const [file, setFile] = useState<{ data: Uint8Array } | null>(null);

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

    if (!file) return <p>Loading PDF...</p>;

    return (
        <div className='flex flex-row items-center justify-center'>
            <Document file={file}>
                <Page pageNumber={1} width={750}/>
            </Document>
        </div>
    );
};
