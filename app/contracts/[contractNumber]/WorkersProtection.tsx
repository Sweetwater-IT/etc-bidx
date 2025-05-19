'use client'
import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { styles } from './styles/workerProtectionStyles';
import { User } from '@/types/User';

interface Props {
    sender: User | undefined;
}

export const WorkerProtectionCertification = ({ sender }: Props) => {
    const currentDate = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }).split(',')[0];
    
    // Get current timestamp for digital signature
    const currentTimestamp = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    return (
        <Document title="Worker Protection and Investment Certification Form">
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image
                        style={styles.stateImage}
                        src="/pennsylvania-logo.jpg"
                    />
                    <Text style={styles.title}>Worker Protection and Investment Certification Form</Text>
                </View>
        
                <View style={styles.section}>
                    <Text style={styles.paragraph}>
                        A. Pursuant to Executive Order 2021-06, <i>Worker Protection and Investment</i> (October 21, 2021), the
                        Commonwealth is responsible for ensuring that every worker in Pennsylvania has a safe and healthy work
                        environment and the protections afforded them through labor laws. To that end, contractors and grantees of
                        the Commonwealth must certify that they are in compliance with {`Pennsylvania's`} Unemployment
                        Compensation Law, {`Workers'`} Compensation Law, and all applicable Pennsylvania state labor and workforce
                        safety laws including, but not limited to:
                    </Text>
        
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>1.</Text>
                        <Text style={styles.listText}>Construction Workplace Misclassification Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>2.</Text>
                        <Text style={styles.listText}>Employment of Minors Child Labor Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>3.</Text>
                        <Text style={styles.listText}>Minimum Wage Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>4.</Text>
                        <Text style={styles.listText}>Prevailing Wage Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>5.</Text>
                        <Text style={styles.listText}>Equal Pay Law</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>6.</Text>
                        <Text style={styles.listText}>Employer to Pay Employment Medical Examination Fee Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>7.</Text>
                        <Text style={styles.listText}>Seasonal Farm Labor Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>8.</Text>
                        <Text style={styles.listText}>Wage Payment and Collection Law</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>9.</Text>
                        <Text style={styles.listText}>Industrial Homework Law</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>10.</Text>
                        <Text style={styles.listText}>Construction Industry Employee Verification Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>11.</Text>
                        <Text style={styles.listText}>Act 102: Prohibition on Excessive Overtime in Healthcare</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>12.</Text>
                        <Text style={styles.listText}>Apprenticeship and Training Act</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.listNumber}>13.</Text>
                        <Text style={styles.listText}>Inspection of Employment Records Law</Text>
                    </View>
                </View>
        
                <View style={styles.section}>
                    <Text style={styles.paragraph}>
                        B. Pennsylvania law establishes penalties for providing false certifications, including contract termination; and
                        three-year ineligibility to bid on contracts under 62 Pa. C.S. § 531 (Debarment or suspension).
                    </Text>
                </View>
        
                <View style={styles.certificationSection}>
                    <Text style={[styles.title, { marginBottom: 15 }]}>CERTIFICATION</Text>
                    <Text>
                        I, the official named below, certify I am duly authorized to execute this certification on behalf of the
                        contractor/grantee identified below, and certify that the contractor/grantee identified below is compliant with
                        applicable Pennsylvania state labor and workplace safety laws, including, but not limited to, those listed in
                        Paragraph A, above. I understand that I must report any change in the {`contractor/grantee's`} compliance status to
                        the Purchasing Agency immediately. I further confirm and understand that this Certification is subject to the
                        provisions and penalties of 18 Pa. C.S. § 4904 (Unsworn falsification to authorities).
                    </Text>
                </View>
        
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell]}>
                            {sender && <Text style={styles.digitalSignature}>Digitally signed by {sender.name}</Text>}
                            <Text style={styles.digitalSignature}>Date: {currentTimestamp}</Text>
                        </View>
                        <View style={[styles.signatureCell, styles.rightCell]}>
                            <Text>{currentDate}</Text>
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell]}>
                            <Text>Signature</Text>
                        </View>
                        <View style={[styles.signatureCell, styles.rightCell]}>
                            <Text>Date</Text>
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell, { minHeight: 40 }]}>
                            {sender && <Text>{sender.name.toUpperCase()}</Text>}
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell]}>
                            <Text>Name (Printed)</Text>
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell, { minHeight: 40 }]}>
                            {sender && <Text>{sender?.role}</Text>}
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell]}>
                            <Text>Title of Certifying Official (Printed)</Text>
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell, { minHeight: 40 }]}>
                            <Text>ESTABLISHED TRAFFIC CONTROL, INC</Text>
                        </View>
                    </View>
                    <View style={styles.signatureRow}>
                        <View style={[styles.signatureCell, styles.leftCell, styles.lastRowCell]}>
                            <Text>Contractor/Grantee Name (Printed)</Text>
                        </View>
                    </View>
                </View>
        
                <View style={styles.footer}>
                    <Text>BOP-2201</Text>
                    <Text>Published: 02/04/2022</Text>
                </View>
            </Page>
        </Document>
          );
}

export default WorkerProtectionCertification;