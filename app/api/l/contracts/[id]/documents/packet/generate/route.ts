import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { FringeBenefitsStatement } from '@/app/contracts/[contractNumber]/EmploymentBenefits';
import { WorkerProtectionCertification } from '@/app/contracts/[contractNumber]/WorkersProtection';
import { GenerateEmploymentVerificationForm } from '@/app/contracts/[contractNumber]/EmploymentVerification';
import { supabase } from '@/lib/supabase';
import type { GeneratedContractDocType } from '@/lib/contract-packet';

const COMPANY_ADDRESS = '3162 Unionville Pike, Hatfield, PA 19440';
const COMPANY_EMAIL = 'info@establishedtraffic.com';
const COMPANY_ROLE = 'Established Traffic Control, Inc.';

function toNumber(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOwner(owner?: string | null) {
  const normalized = (owner || '').trim().toUpperCase();
  if (normalized === 'PENNDOT' || normalized === 'SEPTA') return normalized;
  if (normalized === 'TURNPIKE') return 'TURNPIKE';
  if (normalized === 'PRIVATE') return 'PRIVATE';
  return 'OTHER';
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    console.log('[API] POST /api/l/contracts/[id]/documents/packet/generate - Generating PDF for contract:', contractId);

    const body = await request.json();
    const { docType, projectInfo, user } = body as {
      docType: GeneratedContractDocType;
      projectInfo: any;
      user?: any;
    };

    if (!docType) {
      return NextResponse.json({ error: 'docType is required' }, { status: 400 });
    }

    const owner = normalizeOwner(projectInfo.projectOwner);
    const useFederalRates = projectInfo.isCertifiedPayroll === 'federal';
    const laborRate = useFederalRates ? toNumber(projectInfo.federalMptBaseRate) : toNumber(projectInfo.stateMptBaseRate);
    const fringeRate = useFederalRates ? toNumber(projectInfo.federalMptFringeRate) : toNumber(projectInfo.stateMptFringeRate);
    const shopRate = toNumber(projectInfo.shopRate);

    const adminData = {
      contractNumber: projectInfo.contractNumber || '',
      contract_number: projectInfo.contractNumber || '',
      owner,
      srRoute: projectInfo.stateRoute || '',
      county: {
        name: projectInfo.county || '',
        laborRate,
        shopRate,
        fringeRate,
      },
      rated: projectInfo.isCertifiedPayroll === 'none' ? 'NON-RATED' : 'RATED',
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || COMPANY_EMAIL,
      phone: '',
      title: user?.role || COMPANY_ROLE,
      businessName: 'Established Traffic Control, Inc.',
      businessAddress: COMPANY_ADDRESS,
      federalId: '',
      date: new Date().toISOString().split('T')[0],
      lettingDate: '',
      routeName: '',
      bidDate: '',
      bidTime: '',
      mptBaseRate: 0,
      mptFringeRate: 0,
      mptTotalRate: 0,
      shopRate: 0,
      laborRate,
      contractType: '',
      contractor: projectInfo.customerName || '',
      address: '',
      cityStateZip: '',
      telephone: '',
      fax: '',
      etcRep: '',
      mptNotes: '',
      adminNotes: '',
      isPrime: false,
      isSubContractor: false,
    };

    const laborGroup = 'Labor Group 3';
    const sender = {
      name: user?.name || `${adminData.firstName} ${adminData.lastName}`.trim() || 'Established Traffic Control',
      email: user?.email || adminData.email,
      role: user?.role || adminData.title || COMPANY_ROLE,
    };

    let pdfBuffer: Buffer;
    let filename: string;

    switch (docType) {
      case 'fringe-benefits':
        filename = 'Fringe_Benefits_Letter.pdf';
        const fringeDoc = React.createElement(FringeBenefitsStatement as any, {
          laborGroup,
          sender,
          adminData,
        } as any);
        pdfBuffer = await renderToBuffer(fringeDoc);
        break;

      case 'workers-protection':
        filename = "Workers_Protection_Form.pdf";
        const workerDoc = React.createElement(WorkerProtectionCertification as any, {
          sender,
        } as any);
        pdfBuffer = await renderToBuffer(workerDoc);
        break;

      case 'employment-verification':
        filename = 'Employment_Verification_Form.pdf';
        const evDoc = React.createElement(GenerateEmploymentVerificationForm as any, {
          user: sender,
          adminData,
          description: `${projectInfo.projectName || ''} - ${projectInfo.contractNumber || ''}`,
        } as any);
        pdfBuffer = await renderToBuffer(evDoc);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown docType: ${docType}` },
          { status: 400 }
        );
    }

    const storageFileName = `${Date.now()}_${sanitizeFileName(filename)}`;
    const storagePath = `contracts/${contractId}/generated/${storageFileName}`;

    const { error: storageError } = await supabase.storage
      .from('files')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false });

    if (storageError) {
      return NextResponse.json(
        { error: 'Failed to upload generated PDF', details: storageError.message },
        { status: 500 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('documents_l')
      .insert({
        job_id: contractId,
        file_name: filename,
        file_path: storagePath,
        file_size: pdfBuffer.length,
        file_type: 'contract',
      })
      .select('id, file_name, file_path, file_size, file_type, created_at')
      .single();

    if (insertError) {
      await supabase.storage.from('files').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save generated document metadata', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: String(inserted.id),
        name: inserted.file_name,
        size: inserted.file_size,
        type: 'application/pdf',
        category: 'contract',
        uploadedAt: inserted.created_at,
        filePath: inserted.file_path,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
