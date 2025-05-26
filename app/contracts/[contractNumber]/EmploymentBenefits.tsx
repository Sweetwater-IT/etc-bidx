'use client'
import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { styles } from './styles/benefitsStyles';
import { safeNumber } from '../../../lib/safe-number';
import { AdminData } from '../../../types/TAdminData';
import { User } from '../../../types/User';

interface Props {
    laborGroup : string;
    sender : User
    adminData : AdminData
}

export const FringeBenefitsStatement = ({ laborGroup, sender, adminData }: Props) => {
    return (
        <Document title="Fringe Benefits Statement">
            <Page size="A4" style={styles.page}>
                {/* Header with Logo and Company Info */}
                <View style={styles.header}>
                    <View>
                        <Image style={styles.img} src='/logo.jpg' />
                        <Text style={styles.logoText}>DBE: Veteran Owned</Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text>Established Traffic Control</Text>
                        <Text>3162 Unionville Pike</Text>
                        <Text>Hatfield, PA 19440</Text>
                        <Text>P: 215-997-8801</Text>
                        <Text>Fax: 215-997-8868</Text>
                    </View>
                </View>

                {/* Document Info */}
                <View style={styles.documentInfo}>
                    <View style={styles.dateField}>
                        <Text style={styles.label}>Date:</Text>
                        <Text>
                            {new Date().toLocaleString('en-US', {
                                timeZone: 'America/New_York',
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                            }).split(',')[0]}
                        </Text>
                    </View>
                    <View style={styles.subjectField}>
                        <Text style={styles.label}>Subject:</Text>
                        <Text>Established Traffic Control, Inc. Statement of Fringe Benefits for:</Text>
                    </View>
                    <Text>{adminData.srRoute} {adminData.contractNumber}</Text>
                </View>

                {/* Contract Info */}
                <View style={styles.contractInfo}>
                    <View style={styles.contractRow}>
                        <Text style={styles.label}>Contract/Jobs:</Text>
                        <Text>{adminData.owner !== 'OTHER' && adminData.owner !== 'PRIVATE' && adminData.owner} {adminData.owner === 'PENNDOT' ? 'ECMS ' : ''}{adminData.contractNumber}</Text>
                    </View>
                    <View style={styles.contractRow}>
                        <Text style={styles.label}>Project:</Text>
                        <Text>State Route {adminData.srRoute}</Text>
                    </View>
                    <View style={styles.contractRow}>
                        <Text style={styles.label}>County:</Text>
                        <Text>{adminData.county.name}</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <Text>
                        Established Traffic Control, Inc. pays hourly employees all fringe benefits paid to the
                        following qualified plan:
                    </Text>
                </View>

                {/* Plan Info */}
                <View style={styles.planInfo}>
                    <Text>Contractors & Employees Retirement Trust Contracts# K4286</Text>
                    <Text>2975 Regent Blvd.</Text>
                    <Text>Irving, TX 75063-3140</Text>
                </View>

                {/* Hourly Employees Table */}
                <Text style={styles.tableTitle}>HOURLY EMPLOYEES</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={[styles.tableColClassification, styles.tableHeader]}>
                            <Text>Classification</Text>
                        </View>
                        <View style={[styles.tableColBaseRate, styles.tableHeader]}>
                            <Text>Base Rate</Text>
                        </View>
                        <View style={[styles.tableColFringeBenefit, styles.tableHeader]}>
                            <Text>Fringe Benefit</Text>
                        </View>
                        <View style={[styles.tableColTotal, styles.tableHeader]}>
                            <Text>Total</Text>
                        </View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={[styles.tableColClassification, styles.tableCell]}>
                            <Text>{laborGroup}</Text>
                        </View>
                        <View style={[styles.tableColBaseRate, styles.tableCell]}>
                            <Text>${adminData.rated === 'RATED' ? adminData.county.laborRate : adminData.county.shopRate}</Text>
                        </View>
                        <View style={[styles.tableColFringeBenefit, styles.tableCell]}>
                            <Text>${adminData.rated === 'RATED' ? adminData.county.fringeRate : adminData.county.shopRate}</Text>
                        </View>
                        <View style={[styles.tableColTotal, styles.tableCell]}>
                            <Text>${adminData.rated === 'RATED' ? (safeNumber(adminData.county.laborRate) + safeNumber(adminData.county.fringeRate)).toFixed(2) : adminData.county.shopRate}</Text>
                        </View>
                    </View>
                </View>

                {/* Salary Statement */}
                <View style={styles.mainContent}>
                    <Text>
                        Established Traffic Control, Inc. salary employees receive all benefits paid in cash.
                    </Text>
                </View>

                {/* Salary Employees Table */}
                <Text style={styles.tableTitle}>SALARY EMPLOYEES</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={[styles.tableColClassification, styles.tableHeader]}>
                            <Text>Classification</Text>
                        </View>
                        <View style={[styles.tableColBaseRate, styles.tableHeader]}>
                            <Text>Base Rate</Text>
                        </View>
                        <View style={[styles.tableColFringeBenefit, styles.tableHeader]}>
                            <Text>Fringe Benefit</Text>
                        </View>
                        <View style={[styles.tableColTotal, styles.tableHeader]}>
                            <Text>Total</Text>
                        </View>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={[styles.tableColClassification, styles.tableCell]}>
                            <Text>{laborGroup}</Text>
                        </View>
                        <View style={[styles.tableColBaseRate, styles.tableCell]}>
                            <Text>${adminData.rated === 'RATED' ? adminData.county.laborRate : adminData.county.shopRate}</Text>
                        </View>
                        <View style={[styles.tableColFringeBenefit, styles.tableCell]}>
                            <Text>${adminData.rated === 'RATED' ? adminData.county.fringeRate : adminData.county.shopRate}</Text>
                        </View>
                        <View style={[styles.tableColTotal, styles.tableCell]}>
                            <Text>${adminData.rated === 'RATED' ? (safeNumber(adminData.county.laborRate) + safeNumber(adminData.county.fringeRate)).toFixed(2) : adminData.county.shopRate}</Text>
                        </View>
                    </View>
                </View>

                {/* Contact Info */}
                <View style={styles.contactInfo}>
                    <Text>
                        If you have any questions, please feel free to contact me at {sender.email} or 215-997-8801.
                    </Text>
                </View>

                <Text>Regards,</Text>

                {/* Signature */}
                <View style={styles.signature}>
                    <Text style={styles.signatureName}>{sender.name}</Text>
                    <Text style={styles.signatureTitle}>Established Traffic Control, Inc</Text>
                    <Text style={styles.signatureTitle}>{sender.role}</Text>
                    <Text style={styles.signatureTitle}>Veteran Owned SDB</Text>
                </View>
            </Page>
        </Document>
    );
}
export default FringeBenefitsStatement;