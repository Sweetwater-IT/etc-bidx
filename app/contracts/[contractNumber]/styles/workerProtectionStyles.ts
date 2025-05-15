import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 30, // Reduced padding
    fontSize: 10, // Reduced font size
    fontFamily: 'Times-Roman',
    backgroundColor: 'white',
    lineHeight: 1.2 // Reduced line height
  },
  header: {
    marginBottom: 8, // Reduced margin
    textAlign: 'center',
  },
  stateImage: {
    width: 60, // Smaller image
    height: 60,
    alignSelf: 'center',
    marginBottom: 5, // Reduced margin
  },
  title: {
    fontSize: 12, // Reduced font size
    fontWeight: 'bold',
    marginBottom: 5, // Reduced margin
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: 'Times-Bold',
  },
  section: {
    marginBottom: 10, // Reduced margin
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 2, // Reduced margin
  },
  paragraph: {
    textAlign: 'justify',
    marginBottom: 5, // Reduced margin
  },
  listItem: {
    marginLeft: 15, // Reduced margin
    marginBottom: 1, // Reduced margin
    flexDirection: 'row',
  },
  listNumber: {
    minWidth: 15, // Reduced width
  },
  listText: {
    flex: 1,
  },
  certificationSection: {
    marginTop: 8, // Reduced margin
    marginBottom: 8, // Reduced margin
    textAlign: 'justify',
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
    fontSize: 10, // Reduced font size
  },
  signatureContainer: {
    marginTop: 15, // Reduced margin
    borderWidth: 1,
    borderColor: '#000',
  },
  signatureRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 20, // Reduced height
  },
  signatureCell: {
    padding: 4, // Reduced padding
    fontSize: 10, // Reduced font size
    justifyContent: 'center',
  },
  lastRowCell: {
    borderBottomWidth: 0,
  },
  leftCell: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  rightCell: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 20, // Reduced margin
    left: 30,
    right: 30,
    fontSize: 8, // Reduced font size
  },
  digitalSignature: {
    fontSize: 8, // Reduced font size
    color: '#666',
    marginBottom: 1, // Reduced margin
  },
});