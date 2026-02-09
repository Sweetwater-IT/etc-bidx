import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

// Improved styles with fixed line height and spacing
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
        lineHeight: 1.5,
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
        lineHeight: 1.4,
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
    },
    definitionSection: {
        marginBottom: 15,
    },
    definitionText: {
        fontSize: 10,
        marginBottom: 5,
        lineHeight: 1.4,
    }
});

export const StandardRentalEquipmentAgreement = () => (
    <View style={styles.container} break>
        <Text style={styles.sectionTitle}>STANDARD RENTAL EQUIPMENT AGREEMENT:</Text>

        <View style={styles.definitionSection}>
            <Text style={[styles.boldText, styles.underlineText, { fontSize: 10, marginBottom: 5 }]}>DEFINITIONS.</Text>
            <Text style={styles.definitionText}>{`The following terms are used throughout this Rental Agreement and shall have the following meaning unless the context clearly indicates otherwise.`}</Text>
            <Text style={styles.definitionText}>{`The term "Rental Agreement" shall refer to the contents, terms, conditions, and definitions set forth below.`}</Text>
            <Text style={styles.definitionText}>{`The term "Renter" shall refer to the Customer as specified on page 1 of this Rental Agreement.`}</Text>
            <Text style={styles.definitionText}>{`The term "Rental Equipment" shall mean the truck, attenuator, message boards, speed trailers, or equipment identified in this Rental Agreement and all tires, tools, accessories, and equipment attached thereto or contained therein. Use of the term "Vehicle" or "Rental Vehicle" or "Rental Equipment" in the singular should not exclude the plural "Vehicles" or "Rental Vehicles" or "Equipment".`}</Text>
            <Text style={styles.definitionText}>{`The term "Attendant Equipment" shall mean all tires, tools, accessories, and equipment attached to the Rental Vehicle or Equipment contained therein.`}</Text>
            <Text style={styles.definitionText}>{`The term "Responsible Use" shall mean only normal deterioration of the Rental Vehicle, Equipment and/or Attendant Equipment caused by ordinary and reasonable use for its intended purpose.`}</Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>DAMAGED AND LOST EQUIPMENT.</Text>{` The undersigned (hereinafter referred to as "Renter") hereby assumes all responsibility for all damages or loss to all rental equipment and agrees to pay full cost of all repairs if the Equipment is in any way rendered damaged or out of service, whether this occurred through accident, neglect or misuse. In case of loss or destruction of equipment or loss of possession thereof or inability to return same to `}<Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> the Renter agrees to pay <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL INC.,</Text> the complete and full value of equipment in cash.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>RENTAL TERM PAYMENT.</Text> The Renter agrees to compensate <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL INC.,</Text> for above stated rental rates for each day, week or month consumed while the equipment is in the process of recovery or repair. The Renter agrees that all charges for rentals will be paid in advance (unless otherwise agreed) for the above-described equipment and that all collection fees, attorney fees, court costs or any expenses involved in the collection of rental charges will be borne by the renter.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>EQUIPMENT INSPECTION.</Text> The Renter declares to have examined rented equipment and to have received it in good working condition.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>INDEMNIFICATION.</Text> The Renter hereby absolves <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text>{` and its owners of any responsibility or obligation in the event of accident, regardless of causes or consequences, and that any costs, claims, court or attorney's fees or liability resulting from the use of rented equipment will be indemnified by the renter regardless against whom the claimant or claimants institute action.`}
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>TERMINATION.</Text> The Renter further agrees that <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> may terminate this rental agreement at any time and demand return of all rented equipment and payment in full of all rental owing, in which case the renter agrees to return said equipment and pay said rentals in full.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>TOLLS.</Text> The Renter is responsible for all tolls accrued during the rental period. The Renter is required to add rented vehicles to their toll accounts prior to the start of the rental period or provide a refundable deposit of $500, in the absence of an EZ-Pass or similar account. The Renter agrees to pay all tolls on a rolling 30-day basis during the rental period.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>VIOLATIONS.</Text> The Renter is responsible for all traffic violations, speeding tickets, fines, towing fees and related costs accrued during the rental period.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>RENTAL PERIOD.</Text> The rental rate will be charged from the time equipment leaves our premises until it is returned to same.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>EQUIPMENT CLEANING.</Text> Renter will pay cleaning charges on rental equipment returned unclean.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>QUALIFIED OPERATORS.</Text>{` The Renter declares that only a qualified operator will use rented equipment. Renter agrees that the Vehicle or Equipment will be used only for its intended purpose by an adult with a valid driver's license, adequate supervision, and training.`}
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>RETURN OF EQUIPMENT.</Text> Renter agrees that Equipment remains on rent until you call us for pickup, or it is returned to us.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>INSURANCE REQUIREMENTS.</Text> Renter is required to have necessary insurance coverage, and is responsible for fuel, delivery/pickup, damage, and maintenance.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>CERTIFICATE OF INSURANCE REQUIREMENTS.</Text> Customers are required to provide <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL INC.,</Text> with a Certificate of Insurance naming <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL INC.,</Text>{` as Loss Payee and Additional Insured as it pertains to Commercial Auto Liability, Commercial General Liability and Worker's Compensation for coverage on rental equipment.`}
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>INSURANCE COVERAGE REQUIREMENTS.</Text> The minimum amount of coverage must be $1 million per occurrence/ $2 million Aggregate for Comprehensive Single Limit for Commercial Auto Liability. <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL INC.,</Text>{` requires Statutory Limits on Workers' Compensation Insurance of $100,000 for employee per accident/ $100,000 by disease per employee/ $500,000 policy limit. Certificate of Insurance shall be filed with `}<Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> prior to commencement of the work. These Certificates and the insurance policies required by this Paragraph shall contain provisions stating that <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL INC.,</Text>{` shall be named as an Additional Insured thereunder, using the ISO additional insured endorsement (CG 20 10), and that the policies shall apply on a primary basis. These Certificates and the insurance policies shall provide for at least 30 days' written notice in the event of cancellation, nonrenewal, or material change. An 'intent to notify' is not acceptable.`}
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>{`"AS IS" VEHICLE CONDITION.`}</Text>{` Renter accepts / will accept the Vehicle or Equipment in an "as is" condition. Renter agrees to promptly sign documentation and pictures reflecting the condition of Vehicle or Equipment upon receipt. Such documentation shall reflect the "as-is" condition of Vehicle or Equipment upon its receipt by Renter. The Renter's signatures indicate that the Renter is aware of the "as is" condition of the Rental Vehicle or Equipment. Should Renter fail or refuse to provide signatures, Renter accepts by default all documentation held by `}<Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> as it relates to the condition of the Rental Vehicle. Renter agrees to return the Vehicle or Equipment to <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text>{` in the same condition as it was when delivered into Renter's possession, normal wear from Responsible Use being excepted.`}
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>CLEANING.</Text> Renter accepts all responsibility for cleaning of the Vehicle or Equipment and understands that Renter may be charged for the cost of cleaning of Vehicle / Equipment or Attendant Equipment if returned in a condition other than that in which it was initially received by the Renter.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>TRANSPORTATION.</Text> Renter understands and agrees that <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> shall not assume responsibility for costs related to the transportation of the Vehicle or Equipment. Renter is responsible for all transport costs to and from <Text style={styles.boldText}>{`ESTABLISHED TRAFFIC CONTROL, INC's.,`}</Text> facilities.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>DAMAGE & LOSS.</Text> Renter agrees to bear the costs and liabilities for losses and risks related to the Vehicle or Equipment that are incurred during the Rental Period. This includes loss due to theft, damage or destruction of the Vehicle or Equipment and/or loss incurred at the work site or otherwise that prevents use or operation of the Vehicle or Equipment. All losses of or damage sustained by the Vehicle or Equipment that, in <Text style={styles.boldText}>{`ESTABLISHED TRAFFIC CONTROL, INC's.,`}</Text> opinion can be repaired, will be repaired by <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> Renter agrees to pay the cost of such repairs at <Text style={styles.boldText}>{`ESTABLISHED TRAFFIC CONTROL, INC's.,`}</Text> cost.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>ACCEPTANCE OF TERMS.</Text> In instances where signatures are not obtained on the Rental Agreement at the time of pick-up, drop-off, or delivery, Renter agrees to be bound by the terms and conditions of this Rental Agreement upon facsimile or e-mail transmission of the rental contract by <Text style={styles.boldText}>ESTABLISHED TRAFFIC CONTROL, INC.,</Text> to Renter with the same purpose and effect as if said Rental Agreement had been signed by the parties at the time of delivery of the Vehicle / Equipment and/or Attendant Equipment.
            </Text>
        </View>

        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>• </Text>
            <Text style={styles.bulletText}>
                <Text style={[styles.boldText, styles.underlineText]}>SEVERABILITY.</Text> Should any clause, sentence, paragraph or other part of this Rental Agreement be finally adjudged by any court of competent jurisdiction to be unconstitutional, invalid or in any way unenforceable, such adjudication shall not affect, impair, invalidate or nullify the Rental.
            </Text>
        </View>
    </View>
);