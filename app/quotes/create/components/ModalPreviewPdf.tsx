"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Document, Page } from "react-pdf";

interface PdfPreviewDialogProps {
    file: { id: string; url: string; filename: string } | null;
    onClose: () => void;
    onConfirm: (fileId: string) => void;
}

export function PdfPreviewDialog({ file, onClose, onConfirm }: PdfPreviewDialogProps) {
    const [pageNumber, setPageNumber] = useState(1);
    const [numPages, setNumPages] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        if (containerRef.current) {
            setContainerHeight(containerRef.current.clientHeight);
        }
    }, [file]);

    if (!file) return null;

    return (
        <Dialog open={!!file} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] bg-gray-100 flex flex-col">
                <DialogTitle>{file.filename}</DialogTitle>

                <div className="flex-1 flex items-center justify-center gap-2 w-full">
                    <Button
                        variant="outline"
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber((p) => p - 1)}
                    >
                        ← Prev
                    </Button>

                    <div
                        ref={containerRef}
                        className="flex-1 h-full overflow-auto flex justify-center items-start"
                    >
                        <Document
                            file={file.url}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        >
                            <Page
                                pageNumber={pageNumber}
                                height={containerHeight}
                            />
                        </Document>
                    </div>

                    <Button
                        variant="outline"
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber((p) => p + 1)}
                    >
                        Next →
                    </Button>
                </div>

                <span className="text-center mt-2">
                    Page {pageNumber} of {numPages}
                </span>

                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm(file.id);
                            onClose();
                        }}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
