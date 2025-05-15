import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Times-Roman',
        backgroundColor: 'white',
        lineHeight: 1.3
    },
    header: {
        marginBottom: 8,
        textAlign: 'center',
    },
    stateImage: {
        width: 60,
        height: 60,
        alignSelf: 'center',
        marginBottom: 5,
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
        fontFamily: 'Times-Bold',
    },
    subtitle: {
        fontSize: 10,
        marginBottom: 10,
        textAlign: 'center',
    },
    instructions: {
        fontSize: 9,
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: 'Times-Italic'
    },
    ifDifferent: {
        fontSize: 8, marginTop: -4, marginBottom: 5,
        fontFamily: 'Times-Italic'
    }, 
    formSection: {
        marginBottom: 6,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 4,
        alignItems: 'center',
    },
    formLabel: {
        minWidth: '30%',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Times-Bold'
    },
    formField: {
        width: '70%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        fontSize: 10,
    },
    addressSection: {
        marginBottom: 6,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap'
    },
    addressLabelContainer: {
        width: '30%'
    },
    addressFields: {
        width: '68%'
    },
    addressLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Times-Bold'
    },
    addressField: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 2,
        fontSize: 10,
    },
    addressSmallLabel: {
        fontSize: 8,
        paddingLeft: 2,
    },
    cityStateZipRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    cityField: {
        width: '40%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginRight: '5%',
        paddingBottom: 2,
        fontSize: 10,
    },
    stateField: {
        width: '20%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginRight: '5%',
        paddingBottom: 2,
        fontSize: 10,
    },
    zipField: {
        width: '30%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 2,
        fontSize: 10,
    },
    checkboxRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 10,
        marginRight: 20,
        fontWeight: 'bold',
        fontFamily: 'Times-Bold'
    },
    checkbox: {
        width: 10,
        height: 10,
        border: '1px solid black',
        marginRight: 4,
    },
    checkedBox: {
        width: 12,
        height: 12,
        border: '1px solid black',
        padding: 1,
        backgroundColor: 'white',
        marginRight: 4,
    },
    optionLabel: {
        fontSize: 10,
        marginRight: 15,
    },
    paragraph: {
        fontSize: 10,
        marginBottom: 8,
        textAlign: 'justify',
    },
    signatureSection: {
        marginTop: 15,
    },
    signatureRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 0,
    },
    signatureField: {
        flex: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginRight: 10,
        paddingBottom: 2,
        display: 'flex',
        flexDirection: 'row',
        gap: 24,
        alignContent: 'center'
    },
    dateField: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        textAlign: 'center',
        paddingBottom: 2,
    },
    signatureLabel: {
        marginTop: 2,
        fontWeight: 'bold',
        fontFamily: 'Times-Bold'
    },
    digitalSignature: {
        fontSize: 8,
        marginBottom: 0,
    },
    signatureName: {
        fontWeight: 'bold',
        fontSize: 12
    }
});