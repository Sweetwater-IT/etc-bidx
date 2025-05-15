import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: {
        padding: 30, // Reduced padding to fit content better
        fontSize: 12,
        fontFamily: 'Times-Roman',
        backgroundColor: 'white',
        lineHeight: 1.3 // Reduced line height
    },
    img: {
        width: 150,
        height: 75,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 15, // Reduced margin
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 3,
    },
    companyInfo: {
        textAlign: 'right',
        fontSize: 10,
        lineHeight: 1.4,
    },
    documentInfo: {
        marginTop: 15, // Reduced margin
        marginBottom: 10, // Reduced margin
    },
    dateField: {
        flexDirection: 'row',
        marginBottom: 5, // Reduced margin
    },
    subjectField: {
        flexDirection: 'row',
    },
    label: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    contractInfo: {
        marginTop: 8, // Reduced margin
        marginBottom: 12, // Reduced margin
    },
    contractRow: {
        flexDirection: 'row',
        marginBottom: 3, // Reduced margin
    },
    mainContent: {
        marginTop: 8, // Reduced margin
        marginBottom: 8, // Reduced margin
    },
    planInfo: {
        marginTop: 8, // Reduced margin
        marginBottom: 8, // Reduced margin
    },
    tableTitle: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 12, // Reduced margin
        marginBottom: 6, // Reduced margin
        textDecoration: 'underline',
    },
    table: {
        display: 'flex',
        width: 'auto',
        marginBottom: 12, // Reduced margin
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    tableHeader: {
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 4, // Reduced padding
    },
    tableCell: {
        textAlign: 'center',
        padding: 4, // Reduced padding
    },
    tableColClassification: {
        width: '33%',
    },
    tableColBaseRate: {
        width: '22%',
    },
    tableColFringeBenefit: {
        width: '22%',
    },
    tableColTotal: {
        width: '23%',
    },
    signature: {
        marginTop: 25, // Reduced margin
        marginBottom: 5,
    },
    signatureName: {
        fontWeight: 'bold',
    },
    signatureTitle: {
        fontSize: 10,
    },
    contactInfo: {
        marginTop: 12, // Reduced margin
        marginBottom: 12, // Reduced margin
    },
});