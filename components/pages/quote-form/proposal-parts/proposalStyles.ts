import { StyleSheet } from "@react-pdf/renderer";

export const proposalStyles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
    },
    companyInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5
    },
    etcHeader: {
        fontSize: 12,
        fontWeight: 600
    },
    quoteNumber: {
        fontWeight: 600,
        textAlign: 'right'
    },
    infoText: {
        fontSize: 8,
        marginBottom: 2,
        textAlign: 'right'
    },
    img: {
        width: 100,
        height: 50,
    },
    quoteTable: {
        width: 200,
        border: '1px solid gray',
    },
    quoteTableRow: {
        flexDirection: 'row' as const,
        borderBottom: '1px solid gray',
    },
    quoteTableCell: {
        flex: 1,
        padding: 4,
        fontSize: 10,
    },
    quoteTableLabel: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    validThrough: {
        fontSize: 10,
        marginTop: 5,
    },
    infoGrid: {
        flexDirection: 'column'
    },
    // infoGridCell: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    //     fontSize: 10
    // },
    table: {
        marginTop: 5,
    },
    tableHeader: {
        flexDirection: 'row' as const,
        backgroundColor: '#e4e4e4',
        padding: 5,
    },
    tableHeaderCell: {
        flex: 1,
        fontSize: 10,
        fontWeight: 'bold',
        padding: 3,
    },
    tableRow: {
        flexDirection: 'row' as const,
        borderBottom: '1px solid gray',
        minHeight: 20,
    },
    tableCell: {
        flex: 1,
        fontSize: 9,
        padding: 3,
    },
    warningText: {
        marginTop: 10,
        fontSize: 9,
        textAlign: 'center' as const,
        fontWeight: 'bold',
    },
});