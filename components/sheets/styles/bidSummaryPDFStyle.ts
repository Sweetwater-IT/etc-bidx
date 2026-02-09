import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create(
    {
        page: {
          padding: 10,
          backgroundColor: '#FFFFFF',
          flexDirection: 'column',
        },
        mainContainer: {
          border: '4px solid black'
        },
        container : {
          flexDirection: 'row'
        },
        titleText : {
          color: 'white',
          textAlign: 'center',
          fontWeight: 700
        },
        headerContainer: {
          borderWidth: 1,
          borderColor: '#000000',
          flexDirection: 'column',
        },
        headerRow: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#000000',
          minHeight: 25,
        },
        headerCell: {
          flex: 1,
          flexDirection: 'row',
          borderColor: '#000000',
          padding: 4,
          alignItems: 'center',
        },
        label: {
          fontSize: 8,
          fontWeight: 'bold',
          marginRight: 5,
        },
        value: {
          fontSize: 8,
        },
        sectionTitle: {
          backgroundColor: '#E4E4E4',
          padding: 5,
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: 'center',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: '#000000',
        },
        column: {
          flex: 1,
          borderColor: '#000000',
          flexDirection: 'column',
        },
        mptColumn: {
          flex: 1,
          borderColor: '#000000',
          flexDirection: 'column',
          borderRightWidth: 1
        },
        signsColumn: {
          flex: 1,
          borderColor: '#000000',
          flexDirection: 'column',
          borderLeftWidth : 1
        },
        columnHeader: {
          backgroundColor: '#F8F9FA',
          padding: 4,
          borderBottomWidth: 1,
          borderColor: '#000000',
        },
        columnHeaderText: {
          fontSize: 9,
          fontWeight: 'bold',
        },
        row: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#000000',
          minHeight: 20,
          padding: 4,
          alignItems: 'center',
        },
        cell: {
          flex: 1,
          fontSize: 8,
        },
        rentalHeader: {
          textAlign: 'right',
          flex: 1,
          fontSize: 8,
        },
        quantityCell: {
          width: 40,
          fontSize: 8,
          textAlign: 'right',
        },
        totalStructure: {
          position: 'absolute',
          right: 0,
          top: 0,
          width: 75,
          height: 20,
          borderWidth: 1,
          borderColor: '#000000',
          backgroundColor: '#E4E4E4',
          justifyContent: 'center',
          alignItems: 'center',
        },
        laborSection: {
          marginTop: 20,
          borderWidth: 1,
          borderColor: '#000000',
        },
        laborHeader: {
          backgroundColor: '#F8F9FA',
          padding: 4,
          borderBottomWidth: 1,
          borderColor: '#000000',
        },
        jobSummaryTable: {
          borderWidth: 1,
          flex: 1,
          maxWidth: '100%',
          borderColor: '#000000',
        },
        summaryRow: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#000000',
          padding: 4,
        },
        summaryTotalRow: {
          flexDirection: 'row',
          padding: 4,
          borderBottom: '1px solid black',
          backgroundColor: '#E4E4E4'
        },
        summaryCell: {
          flex: 1,
          fontSize: 8,
          borderColor: '#000000',
          padding: 2,
        },
        summaryCellLast: {
          flex: 1,
          fontSize: 8,
          padding: 2,
        },
        phaseSummaryCell: {
          flex: 1,
          fontSize: 8,
          alignSelf: 'center',
          // borderRightWidth: 1,
          // borderColor: '#000000',
          // height: '100%'
        },
        phaseSummaryFirstCell: {
          flex: 1,
          fontSize: 8,
          alignSelf: 'center',
          paddingRight: 4
          // borderLeftWidth: 1,
          // borderRightWidth: 1,
          // borderColor: '#000000',
          // height: '100%'
        },
      }
)