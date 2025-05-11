import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

// Enhanced styles with support for bold and underlined text
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
    boldText: {
        fontWeight: 'bold',
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
    }
});

export const StandardConditions = () => (
    <View style={styles.container} break>
        <Text style={styles.sectionTitle}>STANDARD CONDITIONS:</Text>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>CONTRACT INCLUSION.</Text> This quote, including all terms and conditions, will be included in any contract between the contractor and <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, Inc.</Text> If any terms in our exclusions / conditions conflict with other terms of the contract documents, the terms of our exclusions shall govern.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>NOTIFICATION OF WORK.</Text> <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> must be notified within <Text style={styles.underlineText}>30 days of bid date</Text> if Contractor is utilizing our proposal. <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> will require a minimum of <Text style={styles.underlineText}>{`2 weeks' notice (4-5 weeks for permanent signs)`}</Text> for all projects to start and/or change.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>PERMANENT SIGNS.</Text> Permanent signing proposals include an original set of shop drawings, prepared per original contract plans. Additional permanent signing shop drawing requests are <Text style={styles.boldText}>$150.00 per drawing</Text>.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>RETENTION.</Text> No retention will be withheld.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>PAYMENT TERMS / CONDITIONS.</Text> Payment for lump sum items shall be <Text style={styles.boldUnderlineText}>35% paid on the 1st estimate for mobilization</Text>. The remaining balance will be prorated over the remaining pay estimates.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>ADDITIONAL / OVER DAYS.</Text> A pro-rated charge for the full amount of the contract to include the initial 35% will be assessed or use of <Text style={styles.boldText}>PENNDOT Publication 408, section 110.03[d]3a</Text> if the contract exceeds the MPT completion date and/or goes over the MPT days.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>DELAYED PAYMENT.</Text> If payment by owner to contractor is delayed due to a dispute between owner, and contractor not involving the work performed by <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> then payment by contractor to <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> shall not likewise be delayed.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>ADDITIONAL WORK / CHANGE ORDERS.</Text> No extra or additional work will be performed without proper written authorization being approved by the contractor <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.</Text> Extra work orders signed by an agent of the contractor shall provide for full payment of work within <Text style={styles.underlineText}>30 days of invoice date</Text>, regardless of if the owner has paid contractor.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>EQUIPMENT SALE PAYMENT TERMS.</Text> All equipment sale items accepted as a part of this proposal are <Text style={styles.boldUnderlineText}>NET 14 Days</Text>.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>RENTAL EQUIPMENT.</Text> All rental invoices are subject to the rental agreement outlined later in this document. Sales tax is not included. Equipment delivery / pickup fee is not included.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>LOST, STOLEN OR DAMAGED EQUIPMENT.</Text> All material supplied by <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> is project specific (shall remain on the referenced project) and will remain <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> property at project completion. The contractor is responsible for all lost, stolen or damaged materials and will be invoiced to the contractor at replacement price. Payment for lost, stolen or damaged material invoices is <Text style={styles.boldUnderlineText}>NET 30 days</Text> regardless of payment from the owner or responsible party. Materials moved to other projects will be subject to additional invoicing.
            </Text>
        </View>
    </View>
);

export const StandardExclusions = () => (
    <View style={styles.container}>
        <Text style={styles.sectionTitle}>STANDARD EXCLUSIONS:</Text>

        <Text style={styles.paragraph}>
            <Text style={[styles.boldText, styles.underlineText]}>STANDARD EXCLUSIONS.</Text> Standard exclusions apply unless otherwise specified in the quote above.
        </Text>
        <Text>
            <Text style={styles.subheading}>ALL EQUIPMENT </Text><Text style={[styles.boldText, styles.underlineText, { fontSize: 10 }]}>NOT EXPLICITLY INCLUDED IN THE QUOTE ABOVE IS EXCLUDED INCLUDING:</Text>
        </Text>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Sequential lights</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Channelizing devices (unless indicated above)</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Delineators</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Overhead signs</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Signs and sign stands</Text>
        </View>
        <Text>
            <Text style={styles.subheading}>ALL VEHICLES (INCLUSIVE OF OPERATORS) </Text><Text style={[styles.boldText, styles.underlineText, { fontSize: 10 }]}>NOT EXPLICITLY INCLUDED IN THE QUOTE ABOVE IS EXCLUDED INCLUDING:</Text>
        </Text>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Shadow vehicles</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>High reach trucks</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Truck mounted attenuators</Text>
        </View>
        <Text>
            <Text style={styles.subheading}>ALL SERVICES </Text><Text style={[styles.boldText, styles.underlineText, { fontSize: 10 }]}>NOT EXPLICITLY INCLUDED IN THE QUOTE ABOVE IS EXCLUDED INCLUDING:</Text>
        </Text>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Flagging</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Constant surveillance</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Daily adjustments</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Pedestrian protection</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Temporary and permanent rumble strips</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Pavement marking and removal</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Work area patterns</Text>
        </View>

        <Text style={styles.subheading}>OTHER EXCLUSIONS INCLUDE:</Text>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Traffic control supervisor(s)</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Work zone liquidated damages</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Shop plans and drawings</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Professional engineering services</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Arrow panels</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Changeable message boards</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Speed trailers</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Covering, uncovering turning, removing, resetting, altering and relocating existing signs (temporary and permanent)</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Reinstallation of signs removed by the contractor for construction</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Videotaping or recordings</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Concrete or water filled barrier</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Traffic signals and related work</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>All warning lights</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Notification of (including permits from) officials (i.e. police, government, DOT), businesses and property owners</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Backfilling, grading and excavation and / or removal of excavated material</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Core drilling</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Installation of structure mounted signs</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Electrical work</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Location of utilities not covered by PA One Call</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Jack hammering or excavation of rock</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Clearing and grubbing</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Restoration or surface repairs</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Sleeve / anchor placement on bridge deck(s)</Text>
        </View>
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>Incidental items not specifically included above</Text>
        </View>
    </View>
);