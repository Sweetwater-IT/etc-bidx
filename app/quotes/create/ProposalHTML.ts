import { StandardTermsAndConditions } from "@/components/pages/quote-form/BidProposalReactPDF";
import { QuoteItem } from "@/types/IQuoteItem";
import { AdminData } from "@/types/TAdminData";

export const createQuoteEmailHtml = (
    adminData: AdminData,
    items: QuoteItem[] = [],
    customers: string[] = [],
    quoteNumber: string = '',
    quoteDate: Date = new Date(),
    paymentTerms: string,
    county: string = '',
    sr: string = '',
    ecms: string = '',
    includedTaC: StandardTermsAndConditions[] = [],
    customTerms: string = '',
    emailBody: string = '',
    token?: string
  ): string => {
    const calculateTotal = () => {
      if (!items?.length) return 0;
  
      return items.reduce((acc, item) => {
        const discount = item.discount || 0;
        const discountType = item.discountType || 'percentage';
        
        // Calculate parent item value
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const basePrice = quantity * unitPrice;
  
        // Calculate discount amount based on type
        const discountAmount = discountType === 'dollar'
          ? discount
          : (basePrice * (discount / 100));
        
        // Calculate composite items total if they exist
        const compositeTotal = item.associatedItems && item.associatedItems.length > 0
          ? item.associatedItems.reduce((subSum, compositeItem) =>
            subSum + ((compositeItem.quantity || 0) * (compositeItem.unitPrice || 0)), 0)
          : 0;
  
        // Apply discount to the combined total
        return acc + (basePrice + compositeTotal - discountAmount);
      }, 0);
    };
  
    const calculateExtendedPrice = (item: QuoteItem) => {
      const discount = item.discount || 0;
      const discountType = item.discountType || 'percentage';
      
      // Calculate parent item value
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const basePrice = quantity * unitPrice;
  
      // Calculate discount amount based on type
      const discountAmount = discountType === 'dollar'
        ? discount
        : (basePrice * (discount / 100));
        
      // Calculate composite items total if they exist
      const compositeTotal = item.associatedItems && item.associatedItems.length > 0
        ? item.associatedItems.reduce((subSum, compositeItem) =>
          subSum + ((compositeItem.quantity || 0) * (compositeItem.unitPrice || 0)), 0)
        : 0;
  
      // Apply discount to the combined total
      return (basePrice + compositeTotal - discountAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2});
    };
  
    const total = calculateTotal();
    
    // Date handling
    const validThroughDate = new Date(quoteDate);
    validThroughDate.setDate(validThroughDate.getDate() + 30);
  
    const totalDays = (adminData.startDate && adminData.endDate) 
      ? Math.ceil((adminData.endDate.getTime() - adminData.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Generate item rows HTML
    let itemRowsHtml = '';
    if (items && items.length > 0) {
      items.forEach(item => {
        itemRowsHtml += `
          <tr style="border-bottom: 1px solid #000">
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000">${item.itemNumber}</td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000">
              ${item.description}
              ${item.notes ? `<div style="margin-top: 4px; font-size: 9px">${item.notes}</div>` : ''}
            </td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000; text-align: right">
              $${item.unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000; text-align: center">${item.uom || 'EA'}</td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000; text-align: center">${item.quantity}</td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000; text-align: right">
              $${calculateExtendedPrice(item)}
            </td>
          </tr>
        `;
      });
    } else {
      // Empty rows if no items
      for (let i = 0; i < 5; i++) {
        itemRowsHtml += `
          <tr style="border-bottom: 1px solid #000">
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
            <td style="padding: 6px; font-size: 10px; border: 1px solid #000; text-align: right">$&nbsp;&nbsp;&nbsp;-</td>
          </tr>
        `;
      }
    }
  
    // Sale item notice and custom T&C HTML
    const saleItemNoticeHtml = includedTaC.includes('Sale') 
      ? `
        <div style="background-color: #FFFF00; padding: 5px; text-align: center; margin-bottom: 20px">
          <p style="font-size: 8px; color: red; margin: 0">SALE ITEM PAYMENT TERMS ARE NET 14</p>
        </div>
      ` 
      : '';
  
    const customTermsHtml = customTerms 
      ? `
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 10px">
          <p style="font-size: 11px; margin: 0">${customTerms}</p>
        </div>
      ` 
      : '';
  
    // Create the complete HTML email with fixed table layouts
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5">
        <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1)">
          <!-- Email Intro -->
          <div style="margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #0056b3;">
            <p>${emailBody || `Please review the attached quote ${quoteNumber}.`}</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          
          <!-- Header Section with Company Info and Quote Info (as a table) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
            <tr>
              <td width="60%" valign="top">
                <p style="font-size: 12px; margin: 0 0 4px 0; font-weight: bold">ESTABLISHED TRAFFIC CONTROL</p>
                <p style="font-size: 10px; margin: 0 0 2px 0">3162 UNIONVILLE PIKE</p>
                <p style="font-size: 10px; margin: 0 0 2px 0">HATFIELD, PA 19440</p>
                <p style="font-size: 10px; margin: 0 0 2px 0">OFFICE: (215) 997-8801</p>
                <p style="font-size: 10px; margin: 0 0 2px 0">FAX: (215) 997-8868</p>
                <p style="font-size: 10px; margin: 0 0 2px 0">DBE / VBE</p>
              </td>
              <td width="40%" valign="top" align="right">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid black" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 4px 8px; border-bottom: 1px solid black; border-right: 1px solid black; font-size: 10px; font-weight: bold">
                      Quote Date
                    </td>
                    <td style="padding: 4px 8px; border-bottom: 1px solid black; font-size: 10px; font-weight: bold">
                      Quote ID
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; border-bottom: 1px solid black; border-right: 1px solid black; font-size: 10px">
                      ${quoteDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style="padding: 4px 8px; border-bottom: 1px solid black; font-size: 10px">
                      ${quoteNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; border-right: 1px solid black; font-size: 10px; font-weight: bold">
                      Payment Terms
                    </td>
                    <td style="padding: 4px 8px; font-size: 10px">
                      ${paymentTerms}
                    </td>
                  </tr>
                </table>
                <p style="font-size: 10px; margin-top: 8px; text-align: right">
                  Quote valid through ${validThroughDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                </p>
              </td>
            </tr>
          </table>
  
          <!-- Attention and Job Info Table -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
            <tr>
              <td width="35%" valign="top">
                <!-- Attention Box -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="border: 1px solid black; padding: 6px; font-size: 10px; font-weight: bold">
                      Attention
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid black; border-top: none; padding: 6px; font-size: 11px">
                      ${customers.length > 1 ? 'Estimating' : customers[0] || 'Estimating'}
                    </td>
                  </tr>
                </table>
              </td>
              <td width="5%">&nbsp;</td>
              <td width="60%" valign="top">
                <!-- Job Info Box as a proper table -->
                <table width="100%" cellpadding="0" cellspacing="0" border="1" style="border-collapse: collapse;">
                  <tr>
                    <td width="30%" style="padding: 4px; border: 1px solid black; font-size: 10px; font-weight: bold">County:</td>
                    <td width="70%" style="padding: 4px; border: 1px solid black; font-size: 10px">${county}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px; font-weight: bold">State Route:</td>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px">${sr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px; font-weight: bold">ECMS:</td>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px">${ecms}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px; font-weight: bold">Start Date:</td>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px">
                      ${adminData.startDate ? adminData.startDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px; font-weight: bold">End Date:</td>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px">
                      ${adminData.endDate ? adminData.endDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px; font-weight: bold">Total days:</td>
                    <td style="padding: 4px; border: 1px solid black; font-size: 10px">
                      ${totalDays > 0 ? `${totalDays} days` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  
          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 20px">
            <thead>
              <tr style="background-color: #E4E4E4">
                <th style="padding: 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; width: 15%">ITEM # / SKU</th>
                <th style="padding: 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; width: 35%">DESCRIPTION</th>
                <th style="padding: 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; width: 15%">PRICE</th>
                <th style="padding: 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; width: 10%">UOM</th>
                <th style="padding: 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; width: 10%">QTY</th>
                <th style="padding: 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; width: 15%">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
              <!-- Total row -->
              <tr style="border-bottom: 1px solid #000">
                <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
                <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
                <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
                <td style="padding: 6px; font-size: 10px; border: 1px solid #000"></td>
                <td style="padding: 6px; font-size: 10px; border: 1px solid #000; font-weight: bold; text-align: center">TOTAL</td>
                <td style="padding: 6px; font-size: 10px; border: 1px solid #000; font-weight: bold; text-align: right">
                  $${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
              </tr>
            </tbody>
          </table>
  
          <!-- Warning Text -->
          <div style="text-align: center; margin-bottom: 20px">
            <p style="font-size: 8px; font-weight: bold">
              ABOVE PRICING IS SUBJECT TO CHANGE AT ANY TIME DUE TO THE CONTINUED ESCALATION OF RAW MATERIAL AND TRANSPORTATION COSTS. ABOVE PRICES EXCLUDE TAX.
            </p>
          </div>
  
          <!-- Sale Item Notice -->
          ${saleItemNoticeHtml}
  
          <!-- Custom Terms and Conditions -->
          ${customTermsHtml}
  
          ${token ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <a href='${process.env.NEXT_PUBLIC_BASE_APP_URL}/quote-open-form?token=${token}' style="font-size: 10px; color: white; font-weight: bold; margin: 0; padding: 16px; border-radius: 12px; border: 1px solid #c94c03;
                background-color: #c94c03;">
                  PLEASE USE THIS BUTTON TO ACCEPT THIS PROPOSAL. THANK YOU!
                </a>
              </td>
            </tr>
          </table>` : ''}
        </div>
      </div>
    `;
  };