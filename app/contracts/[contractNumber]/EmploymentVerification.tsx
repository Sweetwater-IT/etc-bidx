'use client'
import React from 'react';
import { Page, Text, View, Document, Image, StyleSheet } from '@react-pdf/renderer';
import { styles } from './styles/employeeVerification';
import { AdminData } from '@/types/TAdminData';
// import { User } from '@/types/User';

interface Props {
    adminData : AdminData
    // user : User
    description : string
}

export const GenerateEmployeeVerificationForm = ({
    adminData,
    description,
    // user
} : Props) => {
    const currentDate = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }).split(',')[0];

    const nowUTC = new Date();
    const nowEST = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    // Format the EST date components
    const year = nowEST.getFullYear();
    const month = String(nowEST.getMonth() + 1).padStart(2, '0');
    const day = String(nowEST.getDate()).padStart(2, '0');
    const hours = String(nowEST.getHours()).padStart(2, '0');
    const minutes = String(nowEST.getMinutes()).padStart(2, '0');
    const seconds = String(nowEST.getSeconds()).padStart(2, '0');

    const timestamp = `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;

    return (
        <Document title="Public Works Employment Verification Form">
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image
                        style={styles.stateImage}
                        src="/commonwealth-logo.jpg"
                    />
                    <Text style={styles.title}>Commonwealth of Pennsylvania</Text>
                    <Text style={styles.title}>Public Works Employment Verification Form</Text>
                    <Text style={styles.instructions}>
                        Complete and return the form to the contracting Public Body prior to the award of the contract.
                    </Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Company Legal Name:</Text>
                        <Text style={styles.formField}>Established Traffic Control, Inc.</Text>
                    </View>
                </View>

                <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Doing Business As:</Text>
                    <Text style={styles.formField}>Established Traffic Control</Text>
                </View>
                <Text style={styles.ifDifferent}>
                    (if different from Legal Name)
                </Text>

                <View style={styles.addressSection}>
                    <View style={styles.addressLabelContainer}>
                        <Text style={styles.addressLabel}>Mailing Address:</Text>
                    </View>
                    <View style={styles.addressFields}>
                        <Text style={styles.addressField}>3162 Unionville Pike</Text>
                        <Text style={styles.addressSmallLabel}>Street Address 1</Text>

                        <Text style={styles.addressField}></Text>
                        <Text style={styles.addressSmallLabel}>Street Address 2</Text>

                        <View style={styles.cityStateZipRow}>
                            <Text style={styles.cityField}>Hatfield</Text>
                            <Text style={styles.stateField}>PA</Text>
                            <Text style={styles.zipField}>19440</Text>
                        </View>
                        <View style={[styles.cityStateZipRow, { marginTop: -6 }]}>
                            <Text style={[styles.addressSmallLabel, { width: '40%', marginRight: '5%' }]}>City</Text>
                            <Text style={[styles.addressSmallLabel, { width: '20%', marginRight: '5%' }]}>State</Text>
                            <Text style={[styles.addressSmallLabel, { width: '30%' }]}>Zip Code</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.checkboxRow}>
                    <Text style={styles.checkboxLabel}>Check one:</Text>
                    <View style={styles.checkbox} />
                    <Text style={styles.optionLabel}>Contractor</Text>
                    <View style={styles.checkedBox}>
                        <View style={{ backgroundColor: 'black', width: '100%', height: '100%' }} />
                    </View>
                    <Text style={styles.optionLabel}>Subcontractor</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Contracting Public Body:</Text>
                        <Text style={styles.formField}>{adminData.owner}</Text>
                    </View>
                    <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Contract/Project Number:</Text>
                        <Text style={styles.formField}>{adminData.contractNumber}</Text>
                    </View>
                    <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Project Description:</Text>
                        <Text style={styles.formField}>{description}</Text>
                    </View>
                    <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Project Location:</Text>
                        <Text style={styles.formField}>{adminData.county.name} County</Text>
                    </View>
                    <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Date Enrolled in E-Verify (MM/DD/YYYY):</Text>
                        <Text style={{
                            width: '65%',
                            borderBottomWidth: 1,
                            borderBottomColor: '#000',
                            fontSize: 10,
                            marginLeft: '5%'
                        }}>03/17/2018</Text>
                    </View>
                </View>

                <View style={styles.paragraph}>
                    <Text>
                        As a contractor/subcontractor for the above referenced public works contract, I hereby affirm
                        that as of today's date, {currentDate}, our company is in compliance with the
                        Public Works Employment Verification Act ('the Act') through utilization of the federal E-Verify
                        Program (EVP) operated by the United States Department of Homeland Security. To the best of
                        my/our knowledge, all employees hired are authorized to work in the United States.
                    </Text>
                </View>

                <View style={styles.paragraph}>
                    <Text>
                        It is also agreed to that all public works contractors/subcontractors will utilize the federal EVP to
                        verify the employment eligibility of each new hire within five (5) business days of the employee
                        start date throughout the duration of the public works contract. Documentation confirming the
                        use of the federal EVP upon each new hire shall be maintained in the event of an investigation
                        or audit.
                    </Text>
                </View>

                <View style={styles.paragraph}>
                    <Text>
                        {/* I, {user.name}, authorized representative of the */}
                        company above, attest that the information contained in this verification form is true and
                        correct and understand that the submission of false or misleading information in connection
                        with the above verification shall be subject to sanctions provided by law.
                    </Text>
                </View>

                <View style={styles.signatureSection}>
                    <View style={styles.signatureRow}>
                        <View style={styles.signatureField}>
                            <View style={{ marginTop: 6 }}>
                                {/* <Text style={styles.signatureName}>{user.name}</Text> */}
                            </View>
                            <View>
                                {/* <Text style={styles.digitalSignature}>Digitally signed by {user.name}</Text> */}
                                <Text style={styles.digitalSignature}>Date: {timestamp}</Text>
                            </View>
                        </View>
                        <Text style={styles.dateField}>{currentDate}</Text>
                    </View>
                    <View style={[styles.signatureRow, { marginTop: 2 }]}>
                        <Text style={[styles.signatureLabel, { flex: 2, marginRight: 10 }]}>
                            Authorized Representative Signature
                        </Text>
                        <Text style={[styles.signatureLabel, { flex: 1 }]}>
                            Date of Signature
                        </Text>
                    </View>
                </View>

                <View style={[styles.formRow, { marginTop: 10 }]}>
                    <Text style={styles.formLabel}>Printed Name:</Text>
                    {/* <Text style={styles.formField}>{user.name}</Text> */}
                </View>

                <View style={[styles.formRow, { marginTop: 5 }]}>
                    <Text style={styles.formLabel}>Phone Number:</Text>
                    <Text style={{ width: '30%', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 2 }}>
                        215-997-8801
                    </Text>
                    <Text style={{ width: '10%', textAlign: 'right', marginRight: 5, fontFamily: 'Times-Bold', fontWeight: 'bold' }}>Email:</Text>
                    <Text style={{ width: '30%', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 2 }}>
                        {/* {user.email} */}
                    </Text>
                </View>
            </Page>
        </Document>
    )
};