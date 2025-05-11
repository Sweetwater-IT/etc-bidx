import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 30,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
        textDecoration: 'underline',
    },
    paragraph: {
        fontSize: 13,
        marginBottom: 8,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    bullet: {
        width: 10,
        fontSize: 10,
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
    },
    bulletSubItem: {
        flexDirection: 'row',
        marginLeft: 20,
        marginBottom: 6,
    },
    boldText: {
        fontWeight: 600,
    },
    underlineText: {
        textDecoration: 'underline',
    },
    boldUnderlineText: {
        fontWeight: 'bold',
        textDecoration: 'underline',
    },
    subheading: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 6,
    },
    // Table styles
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000',
        marginTop: 10,
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
    },
    tableCell: {
        padding: 5,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000',
        fontSize: 10,
    },
    tableCellHeader: {
        fontWeight: 'bold',
        fontSize: 10,
    },
    serviceAreaCol: {
        width: '33%',
    },
    notificationCol: {
        width: '33%',
    },
    cancelChargeCol: {
        width: '34%',
    }
});

export const StandardFlaggingTermsConditions = () => (
    <View style={styles.container} break>
        <Text style={styles.sectionTitle}>Standard Flagging Terms and Conditions</Text>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, {textDecoration: 'underline'}]}>FLAGGING STANDARD EXCLUSIONS.</Text> Standard exclusions apply unless otherwise specified in the
                quote above.
            </Text>
        </View>

        <View style={styles.bulletSubItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                Police procurement.
            </Text>
        </View>

        <View style={styles.bulletSubItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                Notification of (including permits from) officials (i.e. police, government, DOT),
                businesses and property owners.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, {textDecoration: 'underline'}]}>NIGHTTIME, WEEKEND HOLIDAY AND EMERGENCY WORK.</Text> Unless explicitly quoted above,
                all orders for nighttime, holiday, weekend or emergency work will be billed at overtime rates.
            </Text>
        </View>

        <View style={styles.bulletSubItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                Any order starting between 3:00pm and 5:00am will be classified as nighttime work
            </Text>
        </View>

        <View style={styles.bulletSubItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                Any order starting between the hours of 7:00pm on Friday to 5:00am on Monday will be classified
                as weekend work.
            </Text>
        </View>

        <View style={styles.bulletSubItem}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                Any order with a start time of less than eight (8) hours after the order was called in and all orders
                placed after 7:00pm on Friday for the next business day will be classified as Emergency.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, {textDecoration: 'underline'}]}>BACK CHARGES:</Text> Under no circumstances, whether based upon contract, tort (including negligence),
                strict liability or otherwise, and whether arising before or after completion of the services, shall Established
                Traffic Control, Inc., be liable to the client (or any party for whom the client is facilitating the provision of
                services) for losses or damages caused by the unavailability of the facilities upon which the services are
                being provided, or for incidental, consequential, or delay damages including, but not limited to, loss of use,
                profits, revenue, or inventory, or claims of third parties, or special or penal damages of any nature caused
                by any unusual conditions, unforeseen delay, and / or amendments or modifications agreed to by the parties
                or third parties.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={styles.boldText}>MINIMUM CHARGES.</Text>{` In addition to any applicable equipment charges, it is Established Traffic Control's
                policy to bill a minimum of 4 hours per crew member per day of scheduled work within our local and core
                service area`}
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={styles.boldText}>CANCELLATIONS.</Text> Cancellations and order change decisions must be communicated to our project
                managers no later than 4 hours prior to the start time in our local service area and 6 hours for jobs in our
                core service area and 24 hours prior to start time in our mobilization service area. If a job is not cancelled or
                changed with sufficient notice, please refer to cancellation charges outlined in the table below:
            </Text>
        </View>

        {/* Table for cancellation charges */}
        <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, styles.serviceAreaCol]}>
                    <Text style={styles.tableCellHeader}>SERVICE AREA</Text>
                </View>
                <View style={[styles.tableCell, styles.notificationCol]}>
                    <Text style={styles.tableCellHeader}>NOTIFICATION</Text>
                </View>
                <View style={[styles.tableCell, styles.cancelChargeCol]}>
                    <Text style={styles.tableCellHeader}>CANCEL CHARGE</Text>
                </View>
            </View>
            <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.serviceAreaCol]}>
                    <Text>LOCAL</Text>
                </View>
                <View style={[styles.tableCell, styles.notificationCol]}>
                    <Text>4</Text>
                </View>
                <View style={[styles.tableCell, styles.cancelChargeCol]}>
                    <Text>25% of quoted lump sum daily rate</Text>
                </View>
            </View>
            <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.serviceAreaCol]}>
                    <Text>CORE</Text>
                </View>
                <View style={[styles.tableCell, styles.notificationCol]}>
                    <Text>6</Text>
                </View>
                <View style={[styles.tableCell, styles.cancelChargeCol]}>
                    <Text>50% of quoted lump sum daily rate</Text>
                </View>
            </View>
            <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.serviceAreaCol]}>
                    <Text>MOBILIZATION</Text>
                </View>
                <View style={[styles.tableCell, styles.notificationCol]}>
                    <Text>8</Text>
                </View>
                <View style={[styles.tableCell, styles.cancelChargeCol]}>
                    <Text>50% of quoted lump sum daily rate</Text>
                </View>
            </View>
        </View>
    </View>
);